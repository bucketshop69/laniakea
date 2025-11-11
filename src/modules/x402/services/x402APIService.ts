import { WalletOverviewData } from '../types';

// Service to interact with the protected x402 API
export class X402APIService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = process.env.VITE_API_BASE_URL || 'http://localhost:4021') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Fetch wallet overview data from the protected x402 API
   * This method will handle the x402 payment flow if required
   */
  async fetchWalletOverview(
    walletAddress: string,
    userId: string,
    paymentProof?: string // Signature or other proof of payment
  ): Promise<WalletOverviewData> {
    try {
      // Construct the API URL
      const url = `${this.apiEndpoint}/api/wallet_overview?wallet_address=${walletAddress}&user_id=${userId}`;
      
      // Prepare headers, potentially including payment proof
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (paymentProof) {
        // Include payment proof in headers if available
        headers['x-payment-proof'] = paymentProof;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      // If the response indicates payment is required (status 422 with x402 info)
      if (response.status === 422) {
        const data = await response.json();
        if (data.x402) {
          // Payment is required, throw a specific error that the UI can handle
          throw new X402PaymentRequiredError(data.x402);
        }
      }

      // If the response is successful, return the data
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data as WalletOverviewData;
    } catch (error) {
      if (error instanceof X402PaymentRequiredError) {
        throw error;
      }
      console.error('Error fetching wallet overview from x402 API:', error);
      throw error;
    }
  }

  /**
   * Verify if the API endpoint is available
   */
  async checkAPIStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/`);
      return response.ok;
    } catch (error) {
      console.error('API endpoint check failed:', error);
      return false;
    }
  }
}

/**
 * Custom error class for x402 payment requirements
 */
class X402PaymentRequiredError extends Error {
  public paymentRequirements: any;

  constructor(paymentRequirements: any) {
    super('Payment required for this resource');
    this.name = 'X402PaymentRequiredError';
    this.paymentRequirements = paymentRequirements;
  }
}

// Export a default instance for easy use
export const x402APIService = new X402APIService();