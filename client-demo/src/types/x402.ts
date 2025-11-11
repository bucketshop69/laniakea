import { PublicKey, Transaction } from '@solana/web3.js';

// x402 payment requirement response from API
export interface X402PaymentRequirement {
  error: string;
  x402: {
    version?: string;
    supported_tokens: string[];
    payment_methods?: string[];
    capabilities?: {
      fee_abstraction: boolean;
      payment_splitting: boolean;
      token_payments: boolean;
    };
    api_endpoints?: string[];
    message: string;
    required_amount: number;
    payment_splits: Array<{
      recipient: string; // Public key as string
      percentage: number;
    }>;
  };
}

// x402 payment verification response
export interface X402VerificationResponse {
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

// x402 settlement response
export interface X402SettlementResponse {
  success: boolean;
  signature: string;
  message: string;
}

// Request body for /get-payment-instruction
export interface X402PaymentInstructionRequest {
  transaction: string; // base64 encoded transaction
  fee_token: string;
  source_wallet: string;
}

// Response body for /get-payment-instruction
export interface X402PaymentInstructionResponse {
  payment_instruction: string; // base64 encoded instruction
  signer_address: string; // public key of the fee payer
}

// Payment configuration
export interface PaymentConfig {
  facilitatorUrl: string;
  apiEndpoint: string;
  requiredAmount: number;
  paymentSplits: Array<{
    recipient: PublicKey;
    amount: number;
  }>;
}

// Wallet connection status
export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';