import { WalletOverviewData } from '../types';

// Error handling for x402 integration
export class X402ErrorHandler {
  /**
   * Handles errors specific to x402 payment flow
   */
  static handleX402Error(error: any): { message: string; action: string; fallback?: any } {
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        message: 'Network error: Unable to connect to payment services. Please check your internet connection.',
        action: 'retry',
      };
    }

    // Check if it's our custom x402 payment required error
    if (error.name === 'X402PaymentRequiredError') {
      return {
        message: `Payment required to access this resource: ${error.paymentRequirements.x402.message}`,
        action: 'initiate-payment',
        fallback: error.paymentRequirements,
      };
    }

    // Check if it's a wallet connection error
    if (error.message?.includes('Wallet not connected')) {
      return {
        message: 'Wallet not connected. Please connect your wallet to proceed with payment.',
        action: 'connect-wallet',
      };
    }

    // Check if it's a transaction signing error
    if (error.message?.includes('Transaction cancelled')) {
      return {
        message: 'Transaction was cancelled. You need to approve the transaction to complete the payment.',
        action: 'retry-transaction',
      };
    }

    // Check if it's an API error from our services
    if (error.response?.status === 402) {
      return {
        message: 'Payment verification failed. Please try again.',
        action: 'retry-payment',
      };
    }

    if (error.response?.status === 503) {
      return {
        message: 'Payment service is temporarily unavailable. Please try again later.',
        action: 'retry-later',
      };
    }

    // Default error handling
    return {
      message: `An error occurred during the payment process: ${error.message || 'Unknown error'}`,
      action: 'retry',
    };
  }

  /**
   * Provides fallback options when x402 payment fails
   */
  static async handlePaymentFailure(
    error: any,
    walletAddress: string,
    userId: string
  ): Promise<WalletOverviewData | null> {
    const errorHandled = this.handleX402Error(error);
    
    console.log(`X402 Error: ${errorHandled.message}. Action: ${errorHandled.action}`);
    
    // In case of payment failure, we could implement fallbacks
    switch (errorHandled.action) {
      case 'connect-wallet':
        // The UI should prompt the user to connect their wallet
        throw error;
        
      case 'initiate-payment':
        // Payment is required, no fallback - re-throw the error
        throw error;
        
      case 'retry-payment':
        // For demo purposes, we'll return sample data
        return this.getFallbackWalletData(walletAddress);
        
      case 'retry-later':
        // For demo purposes, we'll return sample data
        return this.getFallbackWalletData(walletAddress);
        
      default:
        // For other errors, return fallback data
        return this.getFallbackWalletData(walletAddress);
    }
  }

  /**
   * Gets fallback wallet data when payment services are unavailable
   */
  private static getFallbackWalletData(walletAddress: string): WalletOverviewData {
    // Return mock data for demo purposes
    return {
      totalValue: 10000.00,
      change24h: 125.75,
      changePercent24h: 1.25,
      tokenCount: 12,
      walletAddress,
      userInterests: ['SOL', 'USDC', 'Meteora'],
      recommendations: [
        {
          type: 'token',
          name: 'SOL',
          reason: 'Core ecosystem token',
          relevanceScore: 0.9
        },
        {
          type: 'protocol',
          name: 'Meteora',
          reason: 'High yield opportunities',
          relevanceScore: 0.7
        }
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Logs x402 errors for analytics
   */
  static logError(error: any, context: string = 'x402'): void {
    console.error(`[${context}] X402 Error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });
    
    // In a real application, you might send this to an analytics service
    // analytics.track('x402_error', { error: error.message, context });
  }
}

// Service to handle fallbacks when x402 is unavailable
export class X402FallbackService {
  /**
   * Gets wallet data from fallback sources when x402 payment fails
   */
  static async getWalletOverviewWithFallback(
    walletAddress: string,
    userId: string,
    error: any
  ): Promise<WalletOverviewData> {
    console.log('Using fallback service due to x402 error:', error.message);
    
    // Try to get data from alternative sources (cached, public endpoints, etc.)
    try {
      // For demo purposes, return mock data
      return {
        totalValue: 11500.25,
        change24h: 230.50,
        changePercent24h: 2.05,
        tokenCount: 15,
        walletAddress,
        userInterests: ['SOL', 'USDC', 'Jupiter', 'Meteora', 'Drift'],
        recommendations: [
          {
            type: 'token',
            name: 'jupSOL',
            reason: 'Staked SOL with growth potential',
            relevanceScore: 0.9
          },
          {
            type: 'protocol',
            name: 'Drift',
            reason: 'High engagement protocol',
            relevanceScore: 0.8
          },
          {
            type: 'token',
            name: 'bSOL',
            reason: 'Liquid staking token',
            relevanceScore: 0.7
          }
        ],
        lastUpdated: new Date().toISOString(),
      };
    } catch (fallbackError) {
      console.error('Fallback service also failed:', fallbackError);
      
      // Ultimate fallback - return basic mock data
      return {
        totalValue: 5000.00,
        change24h: 0,
        changePercent24h: 0,
        tokenCount: 5,
        walletAddress,
        userInterests: [],
        recommendations: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }
}