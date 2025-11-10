import axios from 'axios';

// Type definitions for Vybe API response
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

const VYBE_API_BASE = process.env.VYBE_API_BASE_URL || 'https://api.vybenetwork.xyz';

/**
 * Fetch wallet token balance from Vybe API
 */
export const fetchWalletBalance = async (
  walletAddress: string
): Promise<VybeAccountBalanceResponse> => {
  const apiKey = process.env.VYBE_API_KEY;
  
  if (!apiKey) {
    throw new Error('VYBE_API_KEY environment variable is not set');
  }
  
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }

  try {
    const url = `${VYBE_API_BASE}/account/token-balance/${walletAddress}`;
    
    const response = await axios.get(url, {
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch wallet balance: ${error.response?.statusText || error.message}`);
    }
    throw error;
  }
};

/**
 * Transform Vybe response to our simplified format
 */
const transformVybeResponse = (
  vybeData: VybeAccountBalanceResponse
): ProfileOverview => {
  const totalValue = parseFloat(vybeData.totalTokenValueUsd);
  const change24h = parseFloat(vybeData.totalTokenValueUsd1dChange);

  // Calculate percentage change
  const changePercent24h = totalValue > 0 && (totalValue - change24h) !== 0
    ? (change24h / (totalValue - change24h)) * 100
    : 0;

  return {
    totalValue,
    change24h,
    changePercent24h,
    tokenCount: vybeData.totalTokenCount,
    walletAddress: vybeData.ownerAddress,
  };
};

/**
 * Main function to get profile overview
 */
export const getWalletOverview = async (
  walletAddress: string
): Promise<ProfileOverview> => {
  try {
    const vybeData = await fetchWalletBalance(walletAddress);
    const overview = transformVybeResponse(vybeData);

    return overview;
  } catch (error) {
    console.error('[VybeService] Failed to fetch wallet overview:', error);
    throw error;
  }
};