import axios from 'axios';
import { X402PaymentRequirement } from '../types/x402';

/**
 * Service class to handle x402 payment discovery
 */
export class PaymentDiscoveryService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Discover payment requirements from a protected API endpoint
   * @param endpoint The protected API endpoint to access
   * @returns Payment requirements from the server
   */
  async discoverPaymentRequirements(endpoint: string): Promise<X402PaymentRequirement | null> {
    try {
      // Try to access the endpoint without payment to get x402 requirements
      const response = await axios.get(`${this.apiEndpoint}${endpoint}`, {
        validateStatus: function (status) {
          // Accept both success (200) and payment required (422) statuses
          return status === 200 || status === 422;
        }
      });

      // Check if the response contains x402 payment requirements
      if (response.data.x402) {
        console.log(`Payment required for endpoint ${endpoint}`);
        console.log(`Message: ${response.data.x402.message}`);
        console.log(`Required amount: ${response.data.x402.required_amount}`);
        console.log(`Supported tokens: ${response.data.x402.supported_tokens.join(', ')}`);
        
        return response.data as X402PaymentRequirement;
      }
      
      // If it was successful without payment, return null
      if (response.status === 200) {
        console.log(`No payment required for endpoint ${endpoint}`);
        return null;
      }

      // For other errors, throw an exception
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      console.error('Error discovering payment requirements:', error);
      throw error;
    }
  }

  /**
   * Get supported tokens from the facilitator
   * @param facilitatorUrl URL of the x402 facilitator
   */
  async getSupportedTokens(facilitatorUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(`${facilitatorUrl}/supported`);
      if (response.data.supported_tokens) {
        return response.data.supported_tokens;
      }
      return [];
    } catch (error) {
      console.error('Error fetching supported tokens:', error);
      throw error;
    }
  }
}