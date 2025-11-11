import { Request, Response } from 'express';
import { Transaction } from '@solana/web3.js';
import { KoraService } from '../services/KoraService';

/**
 * Controller for the /get-payment-instruction endpoint
 * Returns the payment instruction needed for Kora to co-sign the transaction
 */
export const getPaymentInstructionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transaction, fee_token, source_wallet } = req.body;

    if (!transaction || !fee_token || !source_wallet) {
      res.status(400).json({
        error: 'Bad request',
        message: 'transaction, fee_token, and source_wallet are required'
      });
      return;
    }

    const koraService = new KoraService();

    // Get payment instruction from Kora
    const paymentInfo = await koraService.getPaymentInstruction(
      transaction,
      fee_token,
      source_wallet
    );

    // Get Kora signer address
    const signerAddress = await koraService.getKoraSignerPublicKey();

    // Include signer address in the response
    res.json({
      ...paymentInfo,
      signer_address: signerAddress
    });
  } catch (error) {
    console.error('Error in /get-payment-instruction endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get payment instruction'
    });
  }
};
