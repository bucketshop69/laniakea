import { Request, Response } from 'express';
import { Transaction, PublicKey } from '@solana/web3.js';
import { KoraService } from '../services/KoraService';
import { PaymentSplittingUtil } from '../utils/PaymentSplittingUtil';
import { PaymentSettlementRequest, PaymentSettlementResponse } from '../types/x402';

/**
 * Controller for the /settle endpoint
 * Processes the transaction with payment splitting and submits it via Kora
 */
export const settleController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the transaction and payment splits from the request body
    const { transaction, payment_splits, payer } = req.body as PaymentSettlementRequest;

    if (!transaction) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Transaction is required in request body' 
      });
      return;
    }

    if (!payment_splits || !Array.isArray(payment_splits) || payment_splits.length === 0) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Payment splits are required and must be a non-empty array' 
      });
      return;
    }

    if (!payer) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Payer is required for payment splitting' 
      });
      return;
    }

    // Deserialize the transaction from the base64 string
    let solanaTransaction: Transaction;
    try {
      const transactionBuffer = Buffer.from(transaction, 'base64');
      solanaTransaction = Transaction.from(transactionBuffer);
    } catch (error) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Invalid transaction format' 
      });
      return;
    }

    // Validate the payer address
    let payerPublicKey: PublicKey;
    try {
      payerPublicKey = new PublicKey(payer);
    } catch (error) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Invalid payer address' 
      });
      return;
    }

    // Parse the payment splits
    let parsedSplits: Array<{ recipient: PublicKey, amount: number }>;
    try {
      parsedSplits = payment_splits.map((split) => {
        if (!split.recipient || !split.amount) {
          throw new Error('Each payment split must have recipient and amount');
        }
        
        return {
          recipient: new PublicKey(split.recipient),
          amount: Number(split.amount)
        };
      });
    } catch (error) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Invalid payment splits format' 
      });
      return;
    }

    // Add the payment splits to the transaction
    const transactionWithSplits = PaymentSplittingUtil.addPaymentSplits(
      solanaTransaction,
      parsedSplits,
      payerPublicKey
    );

    // Submit the transaction via Kora service
    const koraService = new KoraService();
    const signature = await koraService.signAndSendTransaction(transactionWithSplits);

    // Return the transaction signature
    const response: PaymentSettlementResponse = {
      success: true,
      signature,
      message: 'Transaction settled successfully with payment splits'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in /settle endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to settle transaction' 
    });
  }
};