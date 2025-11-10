import { 
  Transaction, 
  PublicKey, 
  SystemProgram,
  Connection
} from '@solana/web3.js';
import { X402PaymentRequirement } from '../types/x402';

/**
 * Service class to handle transaction creation with payment splits
 */
export class TransactionCreationService {
  private connection: Connection;

  constructor(rpcEndpoint: string = 'https://api.devnet.solana.com') {
    this.connection = new Connection(rpcEndpoint, 'confirmed');
  }

  /**
   * Build a transaction with payment splits as required by the API
   * @param userPublicKey The user's public key
   * @param paymentRequirement The payment requirements from the API
   * @param latestBlockhash The latest blockhash for the transaction
   * @returns A Solana transaction with the required payment splits
   */
  async buildPaymentTransaction(
    userPublicKey: PublicKey, 
    paymentRequirement: X402PaymentRequirement,
    latestBlockhash?: { blockhash: string; lastValidBlockHeight: number }
  ): Promise<Transaction> {
    try {
      const transaction = new Transaction();
      
      // Get or create the latest blockhash if not provided
      const blockhash = latestBlockhash || await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash.blockhash;
      
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

      // Set the fee payer to be the user
      transaction.feePayer = userPublicKey;

      return transaction;
    } catch (error) {
      console.error('Error building payment transaction:', error);
      throw error;
    }
  }

  /**
   * Add additional instructions to an existing transaction
   * @param transaction The existing transaction to modify
   * @param userPublicKey The user's public key
   * @param additionalRecipients Additional recipients to send funds to
   */
  addPaymentInstructions(
    transaction: Transaction,
    userPublicKey: PublicKey,
    additionalRecipients: Array<{ recipient: PublicKey; amount: number }>
  ): Transaction {
    for (const recipientInfo of additionalRecipients) {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: recipientInfo.recipient,
        lamports: recipientInfo.amount,
      });
      
      transaction.add(transferInstruction);
    }
    
    return transaction;
  }

  /**
   * Estimate the transaction size and fees
   * @param transaction The transaction to estimate
   * @returns Size in bytes and estimated fees
   */
  estimateTransactionCost(transaction: Transaction): { size: number; estimatedFees: number } {
    // Serialize the transaction to estimate its size
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    const size = serializedTx.length;
    
    // Estimate fees (in a real implementation, this would use current fee calculator)
    // For now, assume a standard fee of 5000 lamports per signature + 1000 lamports per byte
    const estimatedFees = 5000 * transaction.signatures.length + 1000 * size;
    
    return {
      size,
      estimatedFees
    };
  }
}