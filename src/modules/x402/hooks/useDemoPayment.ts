import { useState, useCallback, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import {
  DemoState,
  PaymentStep,
  ApiStatus,
  TokenType,
  StepTiming,
  WalletBalance,
  DATA_PROVIDER_WALLET_ADDRESS,
  DAO_WALLET_ADDRESS,
  DEVELOPER_WALLET_ADDRESS,
  TOKEN_CONFIGS,
} from '../types/demo';
import { X402PaymentService } from '../services/x402Service';

const INITIAL_BALANCE: WalletBalance = {
  address: '',
  before: 0,
  after: 0,
  earned: 0,
  percentage: 0,
};

export const useDemoPayment = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  // Core state
  const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<PaymentStep>(PaymentStep.IDLE);
  const [stepTimings, setStepTimings] = useState<StepTiming[]>([]);
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDC');

  // Balance state - connected wallet is consumer (pays), demo account is data provider (receives 70%)
  const [balances, setBalances] = useState({
    dataProvider: { ...INITIAL_BALANCE, address: DATA_PROVIDER_WALLET_ADDRESS, percentage: 70 },
    dao: { ...INITIAL_BALANCE, address: DAO_WALLET_ADDRESS, percentage: 10 },
    developer: { ...INITIAL_BALANCE, address: DEVELOPER_WALLET_ADDRESS, percentage: 20 },
  });
  const [isPollingBalances, setIsPollingBalances] = useState(false);

  // Custom wallet address for querying insights (default to demo account)
  const [customWalletAddress, setCustomWalletAddress] = useState<string>(DATA_PROVIDER_WALLET_ADDRESS);

  // Refs
  const stepStartTimeRef = useRef<number>(0);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const paymentServiceRef = useRef<X402PaymentService | null>(null);

  // Get the data provider wallet (queried wallet or default demo account)
  const getDataProviderWallet = useCallback(() => {
    // Use custom wallet if provided and valid, otherwise use default demo account
    if (customWalletAddress && customWalletAddress.trim()) {
      try {
        // Validate it's a valid Solana address
        new PublicKey(customWalletAddress);
        return customWalletAddress;
      } catch {
        // Invalid address, fall back to demo account
        return DATA_PROVIDER_WALLET_ADDRESS;
      }
    }
    return DATA_PROVIDER_WALLET_ADDRESS;
  }, [customWalletAddress]);

  // Initialize payment service - connected wallet pays, queried wallet is data provider (receives 70%)
  useEffect(() => {
    const tokenConfig = TOKEN_CONFIGS[selectedToken];
    const dataProviderWallet = getDataProviderWallet();

    paymentServiceRef.current = new X402PaymentService({
      facilitatorUrl: import.meta.env.VITE_FACILITATOR_URL || 'http://localhost:3000',
      apiEndpoint: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021',
      requiredAmount: tokenConfig.pricePerRequest,
      paymentSplits: [
        { recipient: dataProviderWallet, amount: 0, percentage: 70 }, // Queried wallet receives 70%
        { recipient: DEVELOPER_WALLET_ADDRESS, amount: 0, percentage: 20 },
        { recipient: DAO_WALLET_ADDRESS, amount: 0, percentage: 10 },
      ],
    });
  }, [selectedToken, publicKey, customWalletAddress, getDataProviderWallet]);

  // Start step timing
  const startStep = useCallback((step: PaymentStep) => {
    stepStartTimeRef.current = Date.now();
    setCurrentStep(step);
  }, []);

  // End step timing
  const endStep = useCallback((step: PaymentStep) => {
    const endTime = Date.now();
    const duration = endTime - stepStartTimeRef.current;

    setStepTimings(prev => [
      ...prev,
      {
        step,
        duration,
        startTime: stepStartTimeRef.current,
        endTime,
      },
    ]);
  }, []);

  // Fetch SOL balance
  const fetchSOLBalance = useCallback(async (address: PublicKey): Promise<number> => {
    try {
      const balance = await connection.getBalance(address);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error fetching SOL balance:', error);
      return 0;
    }
  }, [connection]);

  // Fetch USDC balance
  const fetchUSDCBalance = useCallback(async (address: PublicKey): Promise<number> => {
    try {
      const usdcMint = new PublicKey(TOKEN_CONFIGS.USDC.mint);
      const tokenAccount = await getAssociatedTokenAddress(usdcMint, address);
      const accountInfo = await getAccount(connection, tokenAccount);
      return Number(accountInfo.amount) / 1e6; // Convert to USDC
    } catch (error) {
      // Account might not exist
      return 0;
    }
  }, [connection]);

  // Fetch balance based on token type
  const fetchBalance = useCallback(async (address: PublicKey): Promise<number> => {
    if (selectedToken === 'SOL') {
      return fetchSOLBalance(address);
    } else {
      return fetchUSDCBalance(address);
    }
  }, [selectedToken, fetchSOLBalance, fetchUSDCBalance]);

  // Capture balances before payment
  const captureBalancesBefore = useCallback(async () => {
    if (!publicKey) return;

    const dataProviderWallet = getDataProviderWallet();
    const dataProviderBalance = await fetchBalance(new PublicKey(dataProviderWallet));
    const daoBalance = await fetchBalance(new PublicKey(DAO_WALLET_ADDRESS));
    const developerBalance = await fetchBalance(new PublicKey(DEVELOPER_WALLET_ADDRESS));

    setBalances(prev => ({
      dataProvider: {
        ...prev.dataProvider,
        address: dataProviderWallet,
        before: dataProviderBalance,
        after: dataProviderBalance,
      },
      dao: {
        ...prev.dao,
        before: daoBalance,
        after: daoBalance,
      },
      developer: {
        ...prev.developer,
        before: developerBalance,
        after: developerBalance,
      },
    }));
  }, [publicKey, fetchBalance, getDataProviderWallet]);

  // Capture balances after payment
  const captureBalancesAfter = useCallback(async () => {
    if (!publicKey) return;

    const dataProviderWallet = getDataProviderWallet();
    const dataProviderBalance = await fetchBalance(new PublicKey(dataProviderWallet));
    const daoBalance = await fetchBalance(new PublicKey(DAO_WALLET_ADDRESS));
    const developerBalance = await fetchBalance(new PublicKey(DEVELOPER_WALLET_ADDRESS));

    setBalances(prev => ({
      dataProvider: {
        ...prev.dataProvider,
        address: dataProviderWallet,
        after: dataProviderBalance,
        earned: dataProviderBalance - prev.dataProvider.before,
      },
      dao: {
        ...prev.dao,
        after: daoBalance,
        earned: daoBalance - prev.dao.before,
      },
      developer: {
        ...prev.developer,
        after: developerBalance,
        earned: developerBalance - prev.developer.before,
      },
    }));
  }, [publicKey, fetchBalance, getDataProviderWallet]);

  // Start balance polling
  const startBalancePolling = useCallback(() => {
    setIsPollingBalances(true);
    balanceIntervalRef.current = setInterval(async () => {
      if (publicKey) {
        const dataProviderWallet = getDataProviderWallet();
        const dataProviderBalance = await fetchBalance(new PublicKey(dataProviderWallet));
        const daoBalance = await fetchBalance(new PublicKey(DAO_WALLET_ADDRESS));
        const developerBalance = await fetchBalance(new PublicKey(DEVELOPER_WALLET_ADDRESS));

        setBalances(prev => ({
          dataProvider: {
            ...prev.dataProvider,
            after: dataProviderBalance,
            earned: dataProviderBalance - prev.dataProvider.before,
          },
          dao: {
            ...prev.dao,
            after: daoBalance,
            earned: daoBalance - prev.dao.before,
          },
          developer: {
            ...prev.developer,
            after: developerBalance,
            earned: developerBalance - prev.developer.before,
          },
        }));
      }
    }, 2000); // Poll every 2 seconds
  }, [publicKey, fetchBalance, getDataProviderWallet]);

  // Stop balance polling
  const stopBalancePolling = useCallback(() => {
    setIsPollingBalances(false);
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
  }, []);

  // Execute payment flow
  const executePaymentFlow = useCallback(async () => {
    if (!publicKey || !paymentServiceRef.current || !signTransaction) {
      setError('Wallet not connected');
      return;
    }

    try {
      setError(null);
      setStepTimings([]);
      setTransactionSignature(null);

      // Capture balances before
      await captureBalancesBefore();

      // Step 1: Discovery
      startStep(PaymentStep.DISCOVERY);
      setApiStatus('requesting');

      // Use custom wallet address if provided, otherwise use connected wallet
      const queryWallet = customWalletAddress || publicKey.toBase58();
      const paymentReq = await paymentServiceRef.current.discoverPaymentRequirements('/api/user_insights', queryWallet);
      endStep(PaymentStep.DISCOVERY);

      if (!paymentReq) {
        // No payment required - data is free
        setApiStatus('success');
        setCurrentStep(PaymentStep.IDLE);
        return;
      }

      setApiStatus('payment_required');
      setResponseData(paymentReq);

      // Step 2: Build Transaction
      startStep(PaymentStep.BUILD_TRANSACTION);
      const transaction = await paymentServiceRef.current.buildPaymentTransaction(
        publicKey,
        paymentReq
      );
      endStep(PaymentStep.BUILD_TRANSACTION);

      // Step 3: User Signs
      startStep(PaymentStep.USER_SIGNS);
      setApiStatus('processing');
      const signedTransaction = await signTransaction(transaction);
      endStep(PaymentStep.USER_SIGNS);

      // Step 4: Settle
      startStep(PaymentStep.SETTLE);
      startBalancePolling();

      const settlementResult = await paymentServiceRef.current.submitTransaction(signedTransaction);

      if (!settlementResult.success) {
        throw new Error(`Settlement failed: ${settlementResult.message}`);
      }

      setTransactionSignature(settlementResult.signature);
      endStep(PaymentStep.SETTLE);

      // Payment complete! Now fetch the data and update balances
      console.log('🎉 Payment settled! Fetching data...');
      setApiStatus('success');

      // Wait a bit for balances to update on-chain
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Capture final balances
      await captureBalancesAfter();
      stopBalancePolling();

      // Fetch the actual data now that payment is complete (reuse queryWallet from above)
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'}/api/user_insights?wallet_address=${queryWallet}`;
      console.log('📡 Fetching data from:', apiUrl);

      try {
        const dataResponse = await fetch(apiUrl);
        console.log('📥 Data response status:', dataResponse.status);
        const data = await dataResponse.json();
        console.log('✅ Data received:', data);
        setResponseData(data);
      } catch (err) {
        console.error('❌ Error fetching user insights after payment:', err);
        // Set simple fallback data
        setResponseData({
          wallet: queryWallet,
          balance: { sol: 0, lamports: 0 }
        });
      }

      console.log('✅ Payment flow complete!');

    } catch (err) {
      console.error('Payment flow error:', err);
      setError(err instanceof Error ? err.message : 'Payment flow failed');
      setApiStatus('error');
      stopBalancePolling();
    }
  }, [
    publicKey,
    signTransaction,
    startStep,
    endStep,
    captureBalancesBefore,
    captureBalancesAfter,
    startBalancePolling,
    stopBalancePolling,
    customWalletAddress,
  ]);

  // Reset demo
  const resetDemo = useCallback(() => {
    const dataProviderWallet = getDataProviderWallet();
    setApiStatus('idle');
    setResponseData(null);
    setError(null);
    setCurrentStep(PaymentStep.IDLE);
    setStepTimings([]);
    setTransactionSignature(null);
    setBalances({
      dataProvider: { ...INITIAL_BALANCE, address: dataProviderWallet, percentage: 70 },
      dao: { ...INITIAL_BALANCE, address: DAO_WALLET_ADDRESS, percentage: 10 },
      developer: { ...INITIAL_BALANCE, address: DEVELOPER_WALLET_ADDRESS, percentage: 20 },
    });
    stopBalancePolling();
  }, [stopBalancePolling, getDataProviderWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBalancePolling();
    };
  }, [stopBalancePolling]);

  return {
    // State
    apiStatus,
    responseData,
    error,
    currentStep,
    stepTimings,
    transactionSignature,
    selectedToken,
    balances,
    isPollingBalances,
    connected: !!publicKey,
    customWalletAddress,

    // Token config
    tokenConfig: TOKEN_CONFIGS[selectedToken],
    splits: { dataProvider: 70, developer: 20, dao: 10 },

    // Wallets
    userWallet: publicKey,
    daoWallet: new PublicKey(DAO_WALLET_ADDRESS),
    developerWallet: new PublicKey(DEVELOPER_WALLET_ADDRESS),

    // Actions
    executePaymentFlow,
    resetDemo,
    setSelectedToken,
    setCustomWalletAddress,
  };
};
