import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { X402PaymentService } from '../services/x402Service';
import { 
  AIAgent, 
  TransactionStatus, 
  WalletOverviewData,
  X402PaymentConfig,
  PaymentConfig 
} from '../types';

// Configuration for the x402 payment system (with percentage-based splits)
const X402_CONFIG_BASE: X402PaymentConfig = {
  facilitatorUrl: process.env.VITE_FACILITATOR_URL || 'http://localhost:3000',
  apiEndpoint: process.env.VITE_API_BASE_URL || 'http://localhost:4021',
  requiredAmount: 10000, // 0.01 USDC (10000 units = 0.01 USDC with 6 decimals)
  paymentSplits: [
    { recipient: '2jririfhBQ6qkcyiS1G4hjxgoz2zVUhEC3dv38LukgTa', percentage: 100 }, // Pay everything to Kora (simplify for testing)
  ]
};

// Convert percentage-based configuration to amount-based for the service
const convertConfigToAmountBased = (config: X402PaymentConfig): PaymentConfig => {
  return {
    ...config,
    paymentSplits: config.paymentSplits.map(split => ({
      recipient: split.recipient,
      amount: Math.floor((config.requiredAmount * split.percentage) / 100)
    }))
  };
};

export const useX402Payment = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  
  const [aiAgent, setAIAgent] = useState<AIAgent>({
    id: 'ai-agent-001',
    name: 'Alpha Insight Bot',
    status: 'idle',
    request: 'Ready to request wallet overview data',
    lastUpdated: new Date(),
  });
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    status: 'pending',
    signature: null,
    blockTime: null,
  });
  
  const [paymentService, setPaymentService] = useState<X402PaymentService | null>(null);
  const [walletOverview, setWalletOverview] = useState<WalletOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the payment service
  useEffect(() => {
    const amountBasedConfig = convertConfigToAmountBased(X402_CONFIG_BASE);
    const service = new X402PaymentService(amountBasedConfig);
    setPaymentService(service);
  }, []);

  // Function to execute the payment flow
  const executePaymentFlow = useCallback(async (endpoint: string) => {
    console.log('Initiating new Kora payment flow...');
    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    if (!paymentService) {
      setError('Payment service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update AI agent status
      setAIAgent(prev => ({
        ...prev,
        status: 'requesting',
        request: 'Detecting payment requirements...',
        lastUpdated: new Date(),
      }));

      // Step 1: Discover payment requirements
      setCurrentStep(1);
      const paymentReq = await paymentService.discoverPaymentRequirements(endpoint);
      
      if (!paymentReq) {
        // No payment required, try to access directly
        setAIAgent(prev => ({
          ...prev,
          status: 'completed',
          request: 'Access granted! Receiving wallet overview...',
          lastUpdated: new Date(),
        }));
        setCurrentStep(4); // Jump to access step
        setIsLoading(false);
        return;
      }

      setAIAgent(prev => ({
        ...prev,
        request: 'Preparing Kora payment transaction...',
        lastUpdated: new Date(),
      }));

      // Step 2: Build complete payment transaction with Kora
      setCurrentStep(2);
      // Build transaction with payment splits and Kora payment instruction
      let transaction = await paymentService.buildPaymentTransaction(
        publicKey,
        paymentReq
      );

      setAIAgent(prev => ({
        ...prev,
        request: 'Awaiting user signature...',
        lastUpdated: new Date(),
      }));

      // Step 3: Sign the transaction with the user's wallet
      if (signTransaction) {
        transaction = await signTransaction(transaction);
      } else {
        throw new Error('Wallet signTransaction function is not available');
      }

      setAIAgent(prev => ({
        ...prev,
        request: 'Processing payment via Kora facilitator...',
        lastUpdated: new Date(),
      }));

      // Step 4: Settle transaction
      setTransactionStatus(prev => ({ ...prev, status: 'settling' }));
      
      const settlementResult = await paymentService.submitTransaction(
        transaction, // Use the signed transaction
      );

      if (!settlementResult.success) {
        throw new Error(`Transaction settlement failed: ${settlementResult.message}`);
      }

      // Update transaction status
      setTransactionStatus({
        status: 'confirmed',
        signature: settlementResult.signature,
        blockTime: Date.now() / 1000,
      });

      setAIAgent(prev => ({
        ...prev,
        status: 'completed',
        request: 'Access granted! Receiving wallet overview...',
        lastUpdated: new Date(),
      }));

      setCurrentStep(4);

      // Simulate receiving wallet overview data after payment
      setTimeout(() => {
        setWalletOverview({
          totalValue: 12450.75,
          change24h: 302.45,
          changePercent24h: 2.45,
          tokenCount: 18,
          walletAddress: publicKey.toString(),
          userInterests: ['SOL', 'USDC', 'Meteora', 'Drift', 'Jupiter'],
          recommendations: [
            {
              type: 'token',
              name: 'SOL',
              reason: 'Based on your portfolio composition',
              relevanceScore: 0.9
            },
            {
              type: 'protocol',
              name: 'Meteora',
              reason: 'High correlation with your transaction history',
              relevanceScore: 0.8
            },
            {
              type: 'token',
              name: 'jupSOL',
              reason: 'Growth potential in your portfolio',
              relevanceScore: 0.7
            }
          ],
          lastUpdated: new Date().toISOString(),
        });
      }, 500);

    } catch (err) {
      console.error('Payment flow error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAIAgent(prev => ({
        ...prev,
        status: 'error',
        request: 'Error occurred during payment process',
        lastUpdated: new Date(),
      }));
      setTransactionStatus(prev => ({ ...prev, status: 'failed' }));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, paymentService, connection, signTransaction]);

  // Function to reset the demo
  const resetDemo = useCallback(() => {
    setCurrentStep(0);
    setTransactionStatus({
      status: 'pending',
      signature: null,
      blockTime: null,
    });
    setAIAgent({
      id: 'ai-agent-001',
      name: 'Alpha Insight Bot',
      status: 'idle',
      request: 'Ready to request wallet overview data',
      lastUpdated: new Date(),
    });
    setWalletOverview(null);
    setError(null);
  }, []);

  return {
    aiAgent,
    currentStep,
    transactionStatus,
    walletOverview,
    isLoading,
    error,
    connected,
    executePaymentFlow,
    resetDemo,
  };
};