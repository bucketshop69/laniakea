import { PublicKey } from '@solana/web3.js';

// Token types
export type TokenType = 'USDC' | 'SOL';

// Payment step enum
export enum PaymentStep {
  IDLE = 0,
  DISCOVERY = 1,
  BUILD_TRANSACTION = 2,
  USER_SIGNS = 3,
  SETTLE = 4,
}

// API Status
export type ApiStatus =
  | 'idle'
  | 'requesting'
  | 'payment_required'
  | 'processing'
  | 'success'
  | 'error';

// Wallet balance interface
export interface WalletBalance {
  address: string;
  before: number;
  after: number;
  earned: number;
  percentage: number;
}

// Balance state for all parties
export interface BalanceState {
  dataProvider: WalletBalance;
  dao: WalletBalance;
  developer: WalletBalance;
}

// Payment split configuration
export interface PaymentSplit {
  dataProvider: number; // 70
  developer: number; // 20
  dao: number; // 10
}

// Step timing
export interface StepTiming {
  step: PaymentStep;
  duration: number; // milliseconds
  startTime: number;
  endTime?: number;
}

// Demo state interface
export interface DemoState {
  // API State
  apiStatus: ApiStatus;
  responseData: any;
  error: string | null;

  // Payment State
  currentStep: PaymentStep;
  stepTimings: StepTiming[];
  transactionSignature: string | null;

  // Balance State
  balances: BalanceState;
  isPollingBalances: boolean;

  // Configuration
  selectedToken: TokenType;
  tokenMint: string;
  pricePerRequest: number;
  splits: PaymentSplit;

  // Wallets
  userWallet: PublicKey | null;
  daoWallet: PublicKey;
  developerWallet: PublicKey;
}

// API Response interfaces
export interface Payment402Response {
  status: 402;
  message: string;
  x402: {
    amount: number;
    token: string;
    facilitator: string;
    splits: Array<{
      recipient: string;
      percentage: number;
    }>;
  };
}

export interface UserInsightsResponse {
  wallet: string;
  insights: {
    chart_pins: number;
    trade_notes: number;
    market_annotations: number;
  };
  activity: {
    last_active: string;
    total_interactions: number;
  };
  interests: string[];
  premium_data: {
    risk_score: number;
    portfolio_health: string;
    recommended_actions: string[];
  };
}

// Constants
export const DATA_PROVIDER_WALLET_ADDRESS = '5oo5EhwdroKz5Jgrm2ezKsXrWrAVC2guejze8rGc1Kvo'; // Demo account - receives 70%
export const DAO_WALLET_ADDRESS = '3njbEQNmCTh3omVFrkLcq92MZkQ9Dfrvn6LN6SKHpVmr'; // DAO - receives 10%
export const DEVELOPER_WALLET_ADDRESS = '2jririfhBQ6qkcyiS1G4hjxgoz2zVUhEC3dv38LukgTa'; // Developer - receives 20%

// USDC Devnet mint
export const USDC_MINT_DEVNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Token configuration
export interface TokenConfig {
  mint: string;
  decimals: number;
  pricePerRequest: number; // in token units
  symbol: string;
}

export const TOKEN_CONFIGS: Record<TokenType, TokenConfig> = {
  USDC: {
    mint: USDC_MINT_DEVNET,
    decimals: 6,
    pricePerRequest: 10000, // 0.01 USDC
    symbol: 'USDC',
  },
  SOL: {
    mint: 'So11111111111111111111111111111111111111112', // Native SOL
    decimals: 9,
    pricePerRequest: 10000, // 0.00001 SOL
    symbol: 'SOL',
  },
};
