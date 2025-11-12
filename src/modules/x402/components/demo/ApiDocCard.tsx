import { useState, useMemo } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { ApiStatus } from '../../types/demo';

interface ApiDocCardProps {
  apiStatus: ApiStatus;
  responseData: any;
  error: string | null;
  walletAddress: string | null;
  customWalletAddress: string;
  onTryApiCall: () => void;
  onReset: () => void;
  onCustomWalletChange: (address: string) => void;
}

export const ApiDocCard: React.FC<ApiDocCardProps> = ({
  apiStatus,
  responseData,
  error,
  walletAddress,
  customWalletAddress,
  onTryApiCall,
  onReset,
  onCustomWalletChange,
}) => {
  const [activeTab, setActiveTab] = useState<'request' | 'response'>('request');
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Validate wallet address
  const walletValidation = useMemo(() => {
    if (!customWalletAddress || !customWalletAddress.trim()) {
      return { isValid: true, message: '' }; // Empty is ok, will use default
    }
    try {
      new PublicKey(customWalletAddress);
      return { isValid: true, message: 'Valid Solana address' };
    } catch {
      return { isValid: false, message: 'Invalid Solana address' };
    }
  }, [customWalletAddress]);

  const endpoint = '/api/user_insights';
  const fullUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4021'}${endpoint}`;

  const copyToClipboard = (text: string, type: 'endpoint' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'endpoint') {
      setCopiedEndpoint(true);
      setTimeout(() => setCopiedEndpoint(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Use custom wallet if provided, otherwise default demo account
  const displayWallet = customWalletAddress || '5oo5EhwdroKz5Jgrm2ezKsXrWrAVC2guejze8rGc1Kvo';

  const requestCode = `// Request Headers
Authorization: Bearer <wallet_signature>
Accept: application/json

// Query Parameters
wallet_address=${displayWallet}`;

  const get402Response = () => {
    if (apiStatus === 'payment_required' && responseData?.x402) {
      return JSON.stringify(
        {
          status: 402,
          message: 'Payment required',
          x402: responseData.x402,
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        status: 402,
        message: 'Payment required',
        x402: {
          amount: 10000,
          token: 'USDC',
          facilitator: 'http://localhost:3000',
          splits: [
            { recipient: '7xKX...3mD', percentage: 70 },
            { recipient: '3njb...Vmr', percentage: 10 },
            { recipient: '2jri...gTa', percentage: 20 },
          ],
        },
      },
      null,
      2
    );
  };

  const getSuccessResponse = () => {
    if (responseData && !responseData.x402) {
      return JSON.stringify(responseData, null, 2);
    }
    return JSON.stringify(
      {
        wallet: displayWallet,
        balance: {
          sol: 0.5,
          lamports: 500000000
        }
      },
      null,
      2
    );
  };

  const getErrorResponse = () => {
    return JSON.stringify(
      {
        status: 500,
        error: 'Internal Server Error',
        message: error || 'An error occurred',
      },
      null,
      2
    );
  };

  const getResponseCode = () => {
    if (apiStatus === 'error') return getErrorResponse();
    if (apiStatus === 'success') return getSuccessResponse();
    if (apiStatus === 'payment_required') return get402Response();
    return get402Response(); // Default to 402
  };

  const getStatusBadge = () => {
    if (apiStatus === 'error') {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">500 Error</span>;
    }
    if (apiStatus === 'success') {
      return <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">200 OK</span>;
    }
    if (apiStatus === 'payment_required') {
      return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">402 Payment Required</span>;
    }
    return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">Ready</span>;
  };

  const isLoading = apiStatus === 'requesting' || apiStatus === 'processing';
  const canReset = apiStatus === 'success' || apiStatus === 'error';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono rounded">GET</span>
            <h3 className="text-lg font-semibold text-white">User Insights API</h3>
          </div>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <code className="text-sm text-gray-400 font-mono">{fullUrl}</code>
          <button
            onClick={() => copyToClipboard(fullUrl, 'endpoint')}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            {copiedEndpoint ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Tabs with Action Buttons */}
      <div className="flex items-center justify-between border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('request')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'request'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Request
          </button>
          <button
            onClick={() => setActiveTab('response')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'response'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Response
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6">
          <button
            onClick={onTryApiCall}
            disabled={isLoading || canReset || !walletValidation.isValid}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Processing...' : 'Try API Call'}
          </button>

          {canReset && (
            <button
              onClick={onReset}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Reset Demo
            </button>
          )}
        </div>
      </div>

      {/* Wallet Input */}
      <div className="px-6 py-4 bg-gray-800/30 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-gray-400" />
          <label className="text-sm text-gray-400 font-medium">Data Provider Wallet:</label>
          <div className="flex-1 relative">
            <input
              type="text"
              value={customWalletAddress}
              onChange={(e) => onCustomWalletChange(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className={`w-full px-3 py-2 pr-10 bg-gray-900 border rounded-lg text-white text-sm font-mono focus:outline-none transition-colors ${
                walletValidation.isValid
                  ? 'border-gray-700 focus:border-blue-500'
                  : 'border-red-500 focus:border-red-400'
              }`}
              disabled={apiStatus === 'requesting' || apiStatus === 'processing'}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {customWalletAddress && (
                walletValidation.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )
              )}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2 mt-2 ml-8">
          {walletValidation.isValid ? (
            <p className="text-xs text-gray-500">
              This wallet will receive 70% of the payment as the data provider
            </p>
          ) : (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {walletValidation.message}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'request' ? (
          <div className="space-y-4">
            <div className="relative">
              <button
                onClick={() => copyToClipboard(requestCode, 'code')}
                className="absolute top-2 right-2 p-2 hover:bg-gray-800 rounded transition-colors z-10"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <SyntaxHighlighter
                language="bash"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  background: '#0d1117',
                }}
              >
                {requestCode}
              </SyntaxHighlighter>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SyntaxHighlighter
              language="json"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                background: '#0d1117',
                maxHeight: '400px',
              }}
            >
              {getResponseCode()}
            </SyntaxHighlighter>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};
