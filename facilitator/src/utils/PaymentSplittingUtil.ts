import { Transaction, TransactionInstruction, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';

interface PaymentSplit {
  recipient: PublicKey;
  amount: number; // in lamports
}

/**
 * Utility functions for handling payment splitting logic in x402 transactions
 */
export class PaymentSplittingUtil {
  /**
   * Adds payment splits to a transaction by inserting transfer instructions
   * @param transaction The original transaction to add payments to
   * @param splits Array of payment splits to add to the transaction
   * @param payer PublicKey of the account that will pay for the additional transfers
   * @returns New transaction with payment splits included
   */
  static addPaymentSplits(
    transaction: Transaction,
    splits: PaymentSplit[],
    payer: PublicKey
  ): Transaction {
    // Create a new transaction based on the original one
    const newTransaction = new Transaction();
    
    // Copy over the original instructions
    for (const instruction of transaction.instructions) {
      newTransaction.add(instruction);
    }

    // Add payment split instructions
    for (const split of splits) {
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: payer,
        toPubkey: split.recipient,
        lamports: split.amount,
      });
      
      newTransaction.add(transferInstruction);
    }

    // Copy over any existing signatures
    newTransaction.signatures = [...transaction.signatures];
    
    return newTransaction;
  }

  /**
   * Calculates payment splits based on a total amount and split configuration
   * @param totalAmount The total amount to split (in lamports)
   * @param splitConfig Array of recipient addresses with their percentage or fixed amount
   * @param recipients PublicKeys of the recipients
   * @returns Array of PaymentSplit objects
   */
  static calculatePaymentSplits(
    totalAmount: number,
    splitConfig: Array<{ recipient: PublicKey, percentage?: number, fixedAmount?: number }>
  ): PaymentSplit[] {
    const splits: PaymentSplit[] = [];
    let remainingAmount = totalAmount;

    // Process fixed amount splits first
    for (const config of splitConfig) {
      if (config.fixedAmount !== undefined) {
        splits.push({
          recipient: config.recipient,
          amount: config.fixedAmount,
        });
        remainingAmount -= config.fixedAmount;
      }
    }

    // Process percentage splits with the remaining amount
    const percentageConfigs = splitConfig.filter(config => config.percentage !== undefined);
    
    let totalPercentage = 0;

    for (const config of percentageConfigs) {
      totalPercentage += (config as { recipient: PublicKey, percentage: number }).percentage;
    }

    if (totalPercentage > 100) {
      throw new Error('Total percentage exceeds 100%');
    }

    // Distribute the remaining amount based on percentage
    for (let i = 0; i < percentageConfigs.length; i++) {
      const config = percentageConfigs[i] as { recipient: PublicKey, percentage: number };
      let amount = 0;

      if (i === percentageConfigs.length - 1) {
        // For the last percentage recipient, use remaining amount to avoid precision issues
        amount = remainingAmount;
      } else {
        // Calculate based on percentage of the total amount
        amount = Math.floor((totalAmount * config.percentage) / 100);
        remainingAmount -= amount;
      }

      splits.push({
        recipient: config.recipient,
        amount: amount,
      });
    }

    return splits;
  }

  /**
   * Parses a transaction to extract payment information
   * @param transaction The transaction to parse
   * @returns Information about payments in the transaction
   */
  static parsePayments(transaction: Transaction) {
    const paymentInstructions: TransactionInstruction[] = [];
    const paymentSplits: PaymentSplit[] = [];

    // Filter for SystemProgram transfer instructions
    for (const instruction of transaction.instructions) {
      if (instruction.programId.equals(SystemProgram.programId)) {
        // This is a system program instruction, potentially a transfer
        if (instruction.data.length === 16) { // Transfer instruction data is 16 bytes
          paymentInstructions.push(instruction);
          
          // Extract the lamport amount from the instruction data (bytes 4-12)
          const lamportsArray = instruction.data.slice(4, 12);
          const lamports = new BN(lamportsArray, 'le').toNumber();
          
          // The first account in the keys array is the fromPubkey
          // The second account in the keys array is the toPubkey
          if (instruction.keys.length >= 2 && instruction.keys[1]) {
            const recipient = instruction.keys[1].pubkey; // toPubkey
            paymentSplits.push({
              recipient,
              amount: lamports,
            });
          }
        }
      }
    }

    return {
      paymentInstructions,
      paymentSplits,
      totalAmount: paymentSplits.reduce((sum, split) => sum + split.amount, 0),
    };
  }
}