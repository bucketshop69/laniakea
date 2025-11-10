import axios from 'axios';
import { Transaction } from '@solana/web3.js';
import { 
  X402VerificationResponse, 
  X402SettlementResponse,
  PaymentConfig 
} from '../types/x402';

/**
 * Service class to handle Kora integration for transaction submission
 */
export class KoraIntegrationService {
  private facilitatorUrl: string;

  constructor(facilitatorUrl: string) {
    this.facilitatorUrl = facilitatorUrl;
  }

  /**
   * Submit a transaction for verification to the facilitator
   * @param transaction The Solana transaction to verify
   * @returns Verification response from the facilitator
   */
  async verifyTransaction(transaction: Transaction): Promise<X402VerificationResponse> {
    try {
      // Serialize the transaction
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      // Send to facilitator for verification
      const response = await axios.post(`${this.facilitatorUrl}/verify`, {
        transaction: base64Transaction
      });

      console.log('Transaction verification response:', response.data);
      return response.data as X402VerificationResponse;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Submit a transaction for settlement to the facilitator
   * @param transaction The Solana transaction to settle
   * @param paymentSplits The payment splits configuration
   * @param payer The public key of the payer
   * @returns Settlement response from the facilitator
   */
  async settleTransaction(
    transaction: Transaction,
    paymentSplits: Array<{ recipient: string; amount: number }>,
    payer: string // Public key as string
  ): Promise<X402SettlementResponse> {
    try {
      // Serialize the transaction
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      // Send to facilitator for settlement
      const response = await axios.post(`${this.facilitatorUrl}/settle`, {
        transaction: base64Transaction,
        payment_splits: paymentSplits,
        payer: payer
      });

      console.log('Transaction settlement response:', response.data);
      return response.data as X402SettlementResponse;
    } catch (error) {
      console.error('Error settling transaction:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Check if the facilitator is available and responding
   */
  async checkFacilitatorStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.facilitatorUrl}/supported`);
      return response.status === 200 && !!response.data;
    } catch (error) {
      console.error('Facilitator is not available:', error);
      return false;
    }
  }
}