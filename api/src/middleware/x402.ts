import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { WalletOverviewResponse, X402PaymentConfig } from '../types/wallet';

// x402 payment middleware configuration
const X402_CONFIG: X402PaymentConfig = {
  facilitatorUrl: process.env.FACILITATOR_URL || 'http://localhost:3000',
  supportedTokens: [
    '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC devnet
    // Add other supported tokens here
  ],
  paymentSplits: [
    {
      recipient: process.env.PLATFORM_FEE_RECIPIENT || '2jririfhBQ6qkcyiS1G4hjxgoz2zVUhEC3dv38LukgTa', // Example recipient
      percentage: 50, // 50% to platform
    },
    {
      recipient: process.env.DATA_PROVIDER_FEE_RECIPIENT || '3njbEQNmCTh3omVFrkLcq92MZkQ9Dfrvn6LN6SKHpVmr', // Example recipient
      percentage: 30, // 30% to data provider
    },
    {
      recipient: process.env.REFERRAL_FEE_RECIPIENT || '2jririfhBQ6qkcyiS1G4hjxgoz2zVUhEC3dv38LukgTa', // Example recipient
      percentage: 20, // 20% to referrer or other party
    },
  ],
  requiredPayment: 1000000, // 0.001 tokens in smallest unit
};

// x402 payment protection middleware
export const x402PaymentMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the queried wallet address - this wallet will be the data provider (70%)
    const walletAddress = req.query.wallet_address as string || req.headers['x-wallet-address'] as string;

    // Build dynamic payment splits - data provider gets 70%
    const dynamicPaymentSplits = [
      {
        recipient: walletAddress || process.env.DATA_PROVIDER_FEE_RECIPIENT || '5oo5EhwdroKz5Jgrm2ezKsXrWrAVC2guejze8rGc1Kvo',
        percentage: 70, // Data provider (queried wallet)
      },
      {
        recipient: process.env.DEVELOPER_FEE_RECIPIENT || '2jririfhBQ6qkcyiS1G4hjxgoz2zVUhEC3dv38LukgTa',
        percentage: 20, // Developer
      },
      {
        recipient: process.env.DAO_FEE_RECIPIENT || '3njbEQNmCTh3omVFrkLcq92MZkQ9Dfrvn6LN6SKHpVmr',
        percentage: 10, // DAO
      },
    ];

    // Check if the request includes proper payment verification
    const paymentToken = req.headers['x-payment-token'] as string;
    const paymentTx = req.headers['x-payment-tx'] as string;

    if (!paymentToken || !paymentTx) {
      // If no payment info provided, redirect to payment flow
      // First, get supported payment methods from facilitator
      try {
        const supportedResponse = await axios.get(`${X402_CONFIG.facilitatorUrl}/supported`);
        res.status(422).json({
          error: 'Payment required',
          x402: {
            ...supportedResponse.data,
            message: 'Payment required for this resource',
            required_amount: X402_CONFIG.requiredPayment,
            payment_splits: dynamicPaymentSplits, // Use dynamic splits based on queried wallet
          }
        });
        return;
      } catch (error) {
        console.error('Error communicating with facilitator:', error);
        res.status(500).json({ 
          error: 'Payment verification service unavailable',
          message: 'Could not verify payment requirements'
        });
        return;
      }
    }

    // Verify the payment with the facilitator
    try {
      const verifyResponse = await axios.post(`${X402_CONFIG.facilitatorUrl}/verify`, {
        transaction: paymentTx,
        payment_splits: dynamicPaymentSplits, // Use dynamic splits
        required_amount: X402_CONFIG.requiredPayment,
      });

      if (verifyResponse.data.success) {
        // Payment verified, attach payment info to request and continue
        (req as any).paymentVerified = true;
        (req as any).paymentInfo = verifyResponse.data;
        next();
      } else {
        res.status(402).json({
          error: 'Payment verification failed',
          x402: {
            message: 'Payment verification failed',
            required_amount: X402_CONFIG.requiredPayment,
          }
        });
      }
    } catch (verifyError) {
      console.error('Payment verification error:', verifyError);
      res.status(402).json({
        error: 'Payment verification failed',
        x402: {
          message: 'Could not verify payment with facilitator',
          required_amount: X402_CONFIG.requiredPayment,
        }
      });
    }
  } catch (error) {
    console.error('x402 middleware error:', error);
    res.status(500).json({ 
      error: 'Payment verification error',
      message: 'An error occurred during payment verification'
    });
  }
};