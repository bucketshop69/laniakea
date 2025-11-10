import { Request, Response } from 'express';
import { Transaction } from '@solana/web3.js';
import { KoraService } from '../services/KoraService';
import { PaymentSplittingUtil } from '../utils/PaymentSplittingUtil';
import { PaymentVerificationRequest, PaymentVerificationResponse } from '../types/x402';

/**
 * Controller for the /verify endpoint
 * Validates the transaction without broadcasting it
 */
export const verifyController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the transaction from the request body
    const { transaction } = req.body as PaymentVerificationRequest;

    if (!transaction) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Transaction is required in request body' 
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

    // Validate the transaction structure
    if (solanaTransaction.instructions.length === 0) {
      res.status(400).json({ 
        error: 'Bad request', 
        message: 'Transaction must contain at least one instruction' 
      });
      return;
    }

    try {
      // Attempt to get a fee estimate from Kora to verify the transaction is valid
      const koraService = new KoraService();
      await koraService.estimateTransactionFee(solanaTransaction);
      
      // Parse any existing payments in the transaction
      const paymentInfo = PaymentSplittingUtil.parsePayments(solanaTransaction);
      
      // Respond with verification details
      const response: PaymentVerificationResponse = {
        success: true,
        transaction_valid: true,
        fee_estimate: paymentInfo.totalAmount,
        transaction_size: solanaTransaction.serialize().length,
        payment_info: paymentInfo,
        message: 'Transaction verified successfully'
      };
      
      res.json(response);
    } catch (koraError) {
      res.status(400).json({ 
        error: 'Verification failed', 
        message: 'Transaction failed Kora validation' 
      });
    }
  } catch (error) {
    console.error('Error in /verify endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to verify transaction' 
    });
  }
};