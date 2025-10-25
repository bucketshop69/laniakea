import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { CandleResolution } from '@drift-labs/sdk';
import { useDriftMarketsStore } from '@/modules/drift/state';
import { DriftCandlestickChart } from './DriftCandlestickChart';

interface DriftStatsProps {
  className?: string;
}

export const DriftStats: React.FC<DriftStatsProps> = ({ className }) => {
  const driftMarkets = useDriftMarketsStore((state) => state.markets);
  const driftSelectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex);
  const driftSnapshots = useDriftMarketsStore((state) => state.snapshots);
  const driftChartData = useDriftMarketsStore((state) => state.chart.data);
  const driftChartLoading = useDriftMarketsStore((state) => state.chart.loading);
  const driftChartResolution = useDriftMarketsStore((state) => state.chart.resolution);
  const setDriftChartResolution = useDriftMarketsStore((state) => state.setChartResolution);

  const selectedDriftMarket = driftMarkets.find((m) => m.marketIndex === driftSelectedMarketIndex);
  const selectedDriftSnapshot = driftSelectedMarketIndex !== null ? driftSnapshots[driftSelectedMarketIndex] : null;

  const resolutionOptions: Array<{ label: string; labelShort: string; value: CandleResolution }> = [
    // { label: '1 Minute', labelShort: '1m', value: '1' },
    { label: '5m', labelShort: '5m', value: '5' },
    { label: '15m', labelShort: '15m', value: '15' },
    { label: '1h', labelShort: '1h', value: '60' },
    // { label: '1 Day', labelShort: '1D', value: 'D' },
  ];

  const assetName = selectedDriftMarket?.symbol || 'Select Market';

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 1 ? 2 : 6,
      notation: value >= 1_000_000 ? 'compact' : 'standard',
    }).format(value);
  };

  const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '—';
    }
    return `${value.toFixed(2)}%`;
  };

  const markPrice = formatCurrency(selectedDriftSnapshot?.markPrice);

  return (
    <Card className={`col-start-1 col-span-7 w-full ${className || ''}`}>
      <div className="flex h-full flex-col">
        {/* Desktop view: full header with stats */}
        <div className="hidden md:flex items-center justify-between">
          <div className='flex'>
            <h2 className="text-xl text-primary">
              {selectedDriftMarket ? `${selectedDriftMarket.symbol}` : 'Drift Market Chart'}
            </h2>
            <span className="text-secondary-foreground ml-2">
              {markPrice}
            </span>
          </div>
          <div className="flex gap-1">
            {resolutionOptions.map((option) => (
              <Button
                key={option.value}
                variant={driftChartResolution === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDriftChartResolution(option.value)}
                className="h-7 px-2 text-xs"
              >
                {option.labelShort}
              </Button>
            ))}
          </div>
        </div>

        {/* Mobile view: minimal header with buttons */}
        <div className="flex md:hidden items-center justify-between mb-4 gap-2">
          <h2 className="text-lg text-primary truncate">
            {assetName}
          </h2>

          <div className="flex gap-1">
            {resolutionOptions.map((option) => (
              <Button
                key={option.value}
                variant={driftChartResolution === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDriftChartResolution(option.value)}
                className="h-7 px-2 text-xs"
              >
                {option.labelShort}
              </Button>
            ))}
          </div>
        </div>

        {/* Chart with responsive height */}
        <div className="chart-wrapper flex-1 min-h-0">
          <DriftCandlestickChart
            key={selectedDriftMarket?.marketIndex ?? 'drift-chart'}
            data={driftChartData}
            isLoading={driftChartLoading}
            marketSymbol={selectedDriftMarket?.symbol}
          />
        </div>
      </div>
    </Card>
  );
};

export default DriftStats;
