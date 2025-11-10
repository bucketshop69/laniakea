// Type for Vybe API response
export interface VybeAccountBalanceResponse {
  ownerAddress: string;
  totalTokenValueUsd: string;
  totalTokenValueUsd1dChange: string;
  totalTokenCount: number;
  tokens: Array<{
    mint: string;
    name: string;
    symbol: string;
    amount: string;
    value: string;
    valueChange1d: string;
    price: string;
    priceChange1d: string;
    logoUri: string;
    chainId: string;
    type: string;
  }>;
}

// Type for our simplified profile overview
export interface ProfileOverview {
  totalValue: number;
  change24h: number;
  changePercent24h: number;
  tokenCount: number;
  walletAddress: string;
}

// Type for user interests from feed system
export interface UserInterest {
  id: string;
  userId: string;
  interestType: string; // e.g., 'token', 'protocol', 'nft_collection'
  interestValue: string; // The specific token, protocol, or collection name
  relevanceScore: number; // How relevant this interest is to the user (0-1)
  lastUpdated: string; // ISO date string
  source: string; // Where the interest came from (e.g., 'transaction', 'annotation', 'search')
}

// Type for wallet overview that combines Vybe data and user interests
export interface WalletOverviewResponse {
  wallet: {
    address: string;
    totalValue: number;
    change24h: number;
    changePercent24h: number;
    tokenCount: number;
  };
  userInterests: UserInterest[];
  recommendations: Array<{
    type: 'token' | 'protocol' | 'nft_collection';
    name: string;
    reason: string;
    relevanceScore: number;
  }>;
  lastUpdated: string;
}

// Type for x402 payment configuration
export interface X402PaymentConfig {
  facilitatorUrl: string;
  supportedTokens: string[];
  paymentSplits: Array<{
    recipient: string; // Public key
    percentage: number; // 0-100
  }>;
  requiredPayment: number; // Amount required for access (in smallest token unit)
}