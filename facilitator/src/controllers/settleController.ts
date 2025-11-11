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
    const { transaction } = req.body as PaymentSettlementRequest;

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

    // Note: Payment splits are already included in the transaction from the frontend
    // No need to add them again - just sign and send the transaction as-is

    // Submit the transaction via Kora service
    const koraService = new KoraService();

    console.log('Attempting to sign and send transaction via Kora...');
    console.log('Transaction has', solanaTransaction.instructions.length, 'instructions');

    const signature = await koraService.signAndSendTransaction(solanaTransaction);

    console.log('Transaction settled successfully with signature:', signature);

    // Return the transaction signature
    const response: PaymentSettlementResponse = {
      success: true,
      signature,
      message: 'Transaction settled successfully with payment splits'
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /settle endpoint:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to settle transaction',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};