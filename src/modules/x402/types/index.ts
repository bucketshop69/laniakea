// Types for x402 module

export interface PaymentSplit {
  recipient: string; // Public key as string
  percentage: number;
  amount: number;
  label: string;
  color: string;
}

export interface AIAgent {
  id: string;
  name: string;
  status: 'idle' | 'requesting' | 'processing' | 'completed' | 'error';
  request: string;
  lastUpdated: Date;
}

export interface TransactionStatus {
  status: 'pending' | 'verifying' | 'settling' | 'confirmed' | 'failed';
  signature: string | null;
  blockTime: number | null;
}

export interface WalletOverviewData {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  tokenCount: number;
  walletAddress: string;
  userInterests: string[];
  recommendations: Array<{
    type: string;
    name: string;
    reason: string;
    relevanceScore: number;
  }>;
  lastUpdated: string;
}

export interface X402PaymentConfig {
  facilitatorUrl: string;
  apiEndpoint: string;
  requiredAmount: number;
  paymentSplits: Array<{
    recipient: string;
    percentage: number;
  }>;
}

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

export interface X402VerificationResponse {
  success: boolean;
  transaction_valid: boolean;
  fee_estimate: number;
  transaction_size: number;
  payment_info: {
    paymentInstructions: any[];
    paymentSplits: Array<{
      recipient: string; // Public key as string
      amount: number;
    }>;
    totalAmount: number;
  };
  message: string;
}

export interface X402SettlementResponse {
  success: boolean;
  signature: string;
  message: string;
}

export interface PaymentConfig {
  facilitatorUrl: string;
  apiEndpoint: string;
  requiredAmount: number;
  paymentSplits: Array<{
    recipient: string;
    amount: number;
  }>;
}

// Request body for /get-payment-instruction
export interface X402PaymentInstructionRequest {
  transaction: string; // base64 encoded transaction
  fee_token: string;
  source_wallet: string;
}

// Response body for /get-payment-instruction
export interface X402PaymentInstructionResponse {
  payment_instruction: {
    programAddress: string;
    accounts: {
      address: string;
      role: number;
    }[];
    data: number[];
  };
  signer_address: string; // public key of the fee payer
}