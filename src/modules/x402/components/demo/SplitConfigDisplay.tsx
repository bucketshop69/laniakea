import { PaymentSplit } from '../../types/demo';

interface SplitConfigDisplayProps {
  splits: PaymentSplit;
  pricePerRequest: number;
  tokenSymbol: string;
  decimals: number;
}

export const SplitConfigDisplay: React.FC<SplitConfigDisplayProps> = ({
  splits,
  pricePerRequest,
  tokenSymbol,
  decimals,
}) => {
  const formatAmount = (percentage: number) => {
    const amount = (pricePerRequest * percentage) / 100;
    return (amount / Math.pow(10, decimals)).toFixed(decimals);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-400">Payment Distribution</h4>

      <div className="space-y-2">
        {/* Data Provider */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Data Provider</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-green-400">
              {formatAmount(splits.dataProvider)} {tokenSymbol}
            </span>
            <span className="text-xs text-gray-500">{splits.dataProvider}%</span>
          </div>
        </div>

        {/* Developer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-300">Developer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-blue-400">
              {formatAmount(splits.developer)} {tokenSymbol}
            </span>
            <span className="text-xs text-gray-500">{splits.developer}%</span>
          </div>
        </div>

        {/* DAO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-300">DAO Treasury</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-purple-400">
              {formatAmount(splits.dao)} {tokenSymbol}
            </span>
            <span className="text-xs text-gray-500">{splits.dao}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="bg-green-500"
          style={{ width: `${splits.dataProvider}%` }}
          title={`Data Provider: ${splits.dataProvider}%`}
        ></div>
        <div
          className="bg-blue-500"
          style={{ width: `${splits.developer}%` }}
          title={`Developer: ${splits.developer}%`}
        ></div>
        <div
          className="bg-purple-500"
          style={{ width: `${splits.dao}%` }}
          title={`DAO: ${splits.dao}%`}
        ></div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <span className="text-sm font-medium text-gray-300">Total per Request</span>
        <span className="text-sm font-mono text-white">
          {(pricePerRequest / Math.pow(10, decimals)).toFixed(decimals)} {tokenSymbol}
        </span>
      </div>
    </div>
  );
};
