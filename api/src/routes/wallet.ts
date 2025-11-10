import { Router, Request, Response } from 'express';
import { getWalletOverviewWithInterests } from '../services/walletOverviewService';
import { x402PaymentMiddleware } from '../middleware/x402';

const router = Router();

// Protected wallet overview endpoint
router.get('/wallet_overview', x402PaymentMiddleware, async (req: Request, res: Response) => {
  try {
    // Extract wallet address and user ID from query parameters or headers
    const walletAddress = req.query.wallet_address as string || req.headers['x-wallet-address'] as string;
    const userId = req.query.user_id as string || req.headers['x-user-id'] as string;

    if (!walletAddress) {
      res.status(400).json({ 
        error: 'Missing required parameter', 
        message: 'wallet_address is required' 
      });
      return;
    }

    if (!userId) {
      res.status(400).json({ 
        error: 'Missing required parameter', 
        message: 'user_id is required' 
      });
      return;
    }

    // Get the comprehensive wallet overview
    const walletOverview = await getWalletOverviewWithInterests(walletAddress, userId);

    // Return the wallet overview data
    res.json(walletOverview);
  } catch (error) {
    console.error('[WalletRoute] Error in /wallet_overview:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to retrieve wallet overview' 
    });
  }
});

export default router;