import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AlertCircle } from 'lucide-react';
import { useDemoPayment } from '../../hooks/useDemoPayment';
import { ApiDocCard } from './ApiDocCard';
import { WalletBalancesCard } from './WalletBalancesCard';
import { PaymentTimeline } from './PaymentTimeline';

export const X402DemoPage: React.FC = () => {
  const { connected } = useWallet();
  const {
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
    tokenConfig,
    splits,
    userWallet,
    customWalletAddress,

    // Actions
    executePaymentFlow,
    resetDemo,
    setSelectedToken,
    setCustomWalletAddress,
  } = useDemoPayment();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">x402 Payment Demo</h1>
              <p className="text-sm text-gray-400 mt-1">
                Live demonstration of gasless payments with automatic revenue splitting
              </p>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {!connected ? (
          /* Wallet Not Connected */
          
          <div className="flex items-center justify-center min-h-[600px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-300">Wallet Not Connected</h2>
              <p className="text-gray-500 max-w-md">
                Please connect your Solana wallet to try the x402 payment demo.
                <br />
                Make sure your wallet has USDC or SOL on Solana Devnet.
              </p>
              <div className="pt-4">
                <WalletMultiButton />
              </div>
            </div>
          </div>
        ) : (
          /* Demo Interface */
          <div className="space-y-6">
            {/* Top Grid - API Docs + Balances */}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                          {/* Payment Timeline - Full width */}

              {/* API Documentation Card - Takes 3/5 width on large screens */}
              <div className="lg:col-span-6">
                                        <PaymentTimeline
              currentStep={currentStep}
              stepTimings={stepTimings}
              transactionSignature={transactionSignature}
            />
                <ApiDocCard
                  apiStatus={apiStatus}
                  responseData={responseData}
                  error={error}
                  walletAddress={userWallet?.toBase58() || null}
                  customWalletAddress={customWalletAddress}
                  onTryApiCall={executePaymentFlow}
                  onReset={resetDemo}
                  onCustomWalletChange={setCustomWalletAddress}
                />
              </div>
            </div>


            {/* Demo Tips */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <span className="font-medium text-white">Demo Tips:</span> Make sure your wallet
                  has USDC or SOL on Solana Devnet. You can get devnet USDC from{' '}
                  <a
                    href="https://faucet.circle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    Circle's Faucet
                  </a>
                  . The payment will be split automatically between the three parties shown in the
                  balances card.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
