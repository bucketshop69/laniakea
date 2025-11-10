import { PublicKey } from '@solana/web3.js';

export interface PaymentSplit {
  recipient: PublicKey;
  amount: number; // in lamports
}

export interface PaymentSplitRequest {
  transaction: string; // base64 encoded transaction
  payment_splits: Array<{
    recipient: string; // base58 encoded public key
    amount: number; // in lamports
  }>;
  payer: string; // base58 encoded public key
}

export interface PaymentVerificationRequest {
  transaction: string; // base64 encoded transaction
}

export interface PaymentVerificationResponse {
  success: boolean;
  transaction_valid: boolean;
  fee_estimate: number;
  transaction_size: number;
  payment_info: {
    paymentInstructions: any[];
    paymentSplits: Array<{
      recipient: PublicKey;
      amount: number;
    }>;
    totalAmount: number;
  };
  message: string;
}

export interface PaymentSettlementRequest {
  transaction: string; // base64 encoded transaction
  payment_splits: Array<{
    recipient: string; // base58 encoded public key
    amount: number; // in lamports
  }>;
  payer: string; // base58 encoded public key
}

export interface PaymentSettlementResponse {
  success: boolean;
  signature: string;
  message: string;
}