import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { WalletBalance } from '../../types/demo';
import { SplitConfigDisplay } from './SplitConfigDisplay';
import { TokenType, TokenConfig } from '../../types/demo';

interface WalletBalancesCardProps {
  balances: {
    dataProvider: WalletBalance;
    dao: WalletBalance;
    developer: WalletBalance;
  };
  selectedToken: TokenType;
  tokenConfig: TokenConfig;
  splits: { dataProvider: number; developer: number; dao: number };
  onSelectToken: (token: TokenType) => void;
  isPolling: boolean;
}

interface BalanceRowProps {
  icon: string;
  label: string;
  balance: WalletBalance;
  tokenSymbol: string;
  decimals: number;
  color: 'green' | 'purple' | 'blue';
}

const BalanceRow: React.FC<BalanceRowProps> = ({
  icon,
  label,
  balance,
  tokenSymbol,
  decimals,
  color,
}) => {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const truncateAddress = (address: string) => {
    if (!address) return '---';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    if (balance.address) {
      navigator.clipboard.writeText(balance.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const formatBalance = (value: number) => {
    return value.toFixed(decimals);
  };

  const colorClasses = {
    green: {
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      flash: 'bg-green-500/20',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      flash: 'bg-purple-500/20',
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      flash: 'bg-blue-500/20',
    },
  };

  const hasEarned = balance.earned > 0;

  return (
    <motion.div
      className={`p-4 border rounded-lg transition-all ${
        hasEarned
          ? `${colorClasses[color].border} ${colorClasses[color].flash}`
          : 'border-gray-800 bg-gray-800/30'
      }`}
      animate={{
        backgroundColor: hasEarned
          ? [colorClasses[color].flash, 'rgba(0,0,0,0.1)']
          : 'rgba(0,0,0,0.1)',
      }}
      transition={{ duration: 1, repeat: hasEarned ? 3 : 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-white">{label}</span>
        </div>
        {balance.address && (
          <div className="flex items-center gap-1">
            <code className="text-xs text-gray-500 font-mono">
              {truncateAddress(balance.address)}
            </code>
            <button
              onClick={copyAddress}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              {copiedAddress ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3 text-gray-500" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Balance Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance</span>
          <div className="flex items-center gap-2">
            {balance.before !== balance.after && (
              <>
                <span className="text-sm text-gray-500 font-mono line-through">
                  {formatBalance(balance.before)}
                </span>
                <span className="text-gray-500">→</span>
              </>
            )}
            <span className={`text-lg font-mono font-bold ${colorClasses[color].text}`}>
              {formatBalance(balance.after)} {tokenSymbol}
            </span>
          </div>
        </div>

        {/* Earned Amount */}
        <AnimatePresence>
          {hasEarned && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center justify-between p-2 ${colorClasses[color].bg} rounded`}
            >
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-4 h-4 ${colorClasses[color].text}`} />
                <span className="text-sm text-gray-300">Earned</span>
              </div>
              <span className={`text-sm font-mono font-bold ${colorClasses[color].text}`}>
                +{formatBalance(balance.earned)} {tokenSymbol} ({balance.percentage}%)
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const WalletBalancesCard: React.FC<WalletBalancesCardProps> = ({
  balances,
  selectedToken,
  tokenConfig,
  splits,
  onSelectToken,
  isPolling,
}) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">💰 Live Balances</h3>
        {isPolling && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Data Provider Balance (Demo Account) */}
        <BalanceRow
          icon="📊"
          label="Data Provider"
          balance={balances.dataProvider}
          tokenSymbol={tokenConfig.symbol}
          decimals={tokenConfig.decimals}
          color="green"
        />

        {/* Developer Balance */}
        <BalanceRow
          icon="👨‍💻"
          label="Developer"
          balance={balances.developer}
          tokenSymbol={tokenConfig.symbol}
          decimals={tokenConfig.decimals}
          color="blue"
        />

        {/* DAO Balance */}
        <BalanceRow
          icon="🏛️"
          label="DAO Treasury"
          balance={balances.dao}
          tokenSymbol={tokenConfig.symbol}
          decimals={tokenConfig.decimals}
          color="purple"
        />

        {/* Divider */}
        <div className="border-t border-gray-800 my-4"></div>

        {/* Payment Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-400">⚙️ Payment Settings</h4>


          {/* Split Configuration */}
          <SplitConfigDisplay
            splits={splits}
            pricePerRequest={tokenConfig.pricePerRequest}
            tokenSymbol={tokenConfig.symbol}
            decimals={tokenConfig.decimals}
          />
        </div>
      </div>
    </div>
  );
};
