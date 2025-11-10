import { Request, Response } from 'express';
import { KoraService } from '../services/KoraService';

interface SupportedResponse {
  version: string;
  supported_tokens: string[];
  payment_methods: string[];
  capabilities: {
    fee_abstraction: boolean;
    payment_splitting: boolean;
    token_payments: boolean;
  };
  api_endpoints: string[];
}

/**
 * Controller for the /supported endpoint
 * Returns information about what the facilitator supports
 */
export const supportedController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get supported tokens from Kora server
    const koraService = new KoraService();
    const supportedTokens = await koraService.getSupportedTokens();

    // Return the capabilities of this facilitator
    const response: SupportedResponse = {
      version: '0.1.0', // x402 protocol version
      supported_tokens: supportedTokens,
      payment_methods: ['split'],
      capabilities: {
        fee_abstraction: true,
        payment_splitting: true,
        token_payments: true,
      },
      api_endpoints: ['/supported', '/verify', '/settle'],
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in /supported endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to retrieve supported capabilities' 
    });
  }
};