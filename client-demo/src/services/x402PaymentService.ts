import axios from 'axios';
import { 
  X402PaymentRequirement, 
  X402VerificationResponse, 
  X402SettlementResponse,
  PaymentConfig,
  X402PaymentInstructionRequest,
  X402PaymentInstructionResponse
} from '../types/x402';
import { Transaction, PublicKey, Connection, Keypair, SystemProgram } from '@solana/web3.js';

/**
 * Service class to handle x402 payment flow
 */
export class X402PaymentService {
  private facilitatorUrl: string;
  private apiEndpoint: string;

  constructor(config: PaymentConfig) {
    this.facilitatorUrl = config.facilitatorUrl;
    this.apiEndpoint = config.apiEndpoint;
  }

  /**
   * Get payment instruction from the facilitator
   * @param transaction The transaction to get payment instruction for
   * @param userPublicKey The user's public key
   * @param feeToken The token to pay the fee in
   * @returns The payment instruction and signer address from the facilitator
   */
  async getPaymentInstruction(
    transaction: Transaction,
    userPublicKey: PublicKey,
    feeToken: string
  ): Promise<X402PaymentInstructionResponse> {
    try {
      const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
      const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

      const request: X402PaymentInstructionRequest = {
        transaction: base64Transaction,
        fee_token: feeToken,
        source_wallet: userPublicKey.toBase58(),
      };

      const response = await axios.post(
        `${this.facilitatorUrl}/get-payment-instruction`,
        request
      );

      return response.data as X402PaymentInstructionResponse;
    } catch (error) {
      console.error('Error getting payment instruction:', error);
      throw error;
    }
  }

  /**
   * Prepares the transaction with the fee payment instruction from Kora.
   * This method modifies the transaction by adding the payment instruction
   * and setting the fee payer to the Kora signer.
   * @param transaction The original transaction
   * @param userPublicKey The user's public key
   * @param feeToken The mint address of the token to pay fees in (e.g., USDC)
   * @returns The modified transaction ready to be signed by the user.
   */
  async prepareTransactionWithFee(
    transaction: Transaction,
    userPublicKey: PublicKey,
    feeToken: string
  ): Promise<Transaction> {
    // Get the payment instruction from the facilitator
    const { payment_instruction, signer_address } = await this.getPaymentInstruction(
      transaction,
      userPublicKey,
      feeToken
    );

    // The payment_instruction is a base64 encoded serialized transaction
    // containing the necessary instruction to pay the fee.
    const paymentTransaction = Transaction.from(
      Buffer.from(payment_instruction, 'base64')
    );

    // Add the payment instruction from the payment transaction
    // to the original transaction.
    transaction.add(...paymentTransaction.instructions);

    // Set the fee payer to the Kora signer address
    transaction.feePayer = new PublicKey(signer_address);

    return transaction;
  }

  /**
   * Discover payment requirements from the API
   * @param endpoint The protected API endpoint to access
   * @returns Payment requirements from the server
   */
  async discoverPaymentRequirements(endpoint: string): Promise<X402PaymentRequirement | null> {
    try {
      // First, try to call the endpoint without payment to get x402 requirements
      const response = await axios.get(`${this.apiEndpoint}${endpoint}`, {
        validateStatus: function (status) {
          // Accept both success (200) and payment required (422) statuses
          return status === 200 || status === 422;
        }
      });

      // Check if the response contains x402 payment requirements
      if (response.data.x402) {
        return response.data as X402PaymentRequirement;
      }
      
      return null;
    } catch (error) {
      console.error('Error discovering payment requirements:', error);
      throw error;
    }
  }

  /**
   * Build a transaction with payment splits as required by the API
   * @param userPublicKey The user's public key
   * @param paymentRequirement The payment requirements from the API
   * @returns A Solana transaction with the required payment splits
   */
  async buildPaymentTransaction(
    userPublicKey: PublicKey, 
    paymentRequirement: X402PaymentRequirement
  ): Promise<Transaction> {
    try {
      const transaction = new Transaction();
      
      // Add payment split instructions based on the requirements
      const splits = paymentRequirement.x402.payment_splits;
      const totalAmount = paymentRequirement.x402.required_amount;
      
      // Calculate and add transfer instructions for each split
      for (const split of splits) {
        const recipient = new PublicKey(split.recipient);
        // Calculate amount based on percentage of total required amount
        const amount = Math.floor((totalAmount * split.percentage) / 100);
        
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: recipient,
          lamports: amount,
        });
        
        transaction.add(transferInstruction);
      }

      return transaction;
    } catch (error) {
      console.error('Error building payment transaction:', error);
      throw error;
    }
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

      return response.data as X402VerificationResponse;
    } catch (error) {
      console.error('Error verifying transaction:', error);
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
      payer: PublicKey
    ): Promise<X402SettlementResponse> {
      try {
        // Serialize the transaction
        const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');
  
        // Send to facilitator for settlement
        const response = await axios.post(`${this.facilitatorUrl}/settle`, {
          transaction: base64Transaction,
          payment_splits: paymentSplits,
          payer: payer.toString()
        });
  
        return response.data as X402SettlementResponse;
      } catch (error) {
        console.error('Error settling transaction:', error);
        throw error;
      }
    }
  
    /**
     * Submit a transaction for settlement to the facilitator using the new Kora flow.
     * @param transaction The Solana transaction to settle
     * @returns Settlement response from the facilitator
     */
    async submitTransaction(
      transaction: Transaction,
    ): Promise<X402SettlementResponse> {
      try {
        // Serialize the transaction
        const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
        const base64Transaction = Buffer.from(serializedTransaction).toString('base64');
  
        // Send to facilitator for settlement
        const response = await axios.post(`${this.facilitatorUrl}/settle`, {
          transaction: base64Transaction,
        });
  
        return response.data as X402SettlementResponse;
      } catch (error) {
        console.error('Error submitting transaction:', error);
        throw error;
      }
    }
  }
  