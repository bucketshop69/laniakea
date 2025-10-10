import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useDriftMarketsStore } from '../state';
import { DriftCandlestickChart } from './DriftCandlestickChart';

type PositionDirection = 'long' | 'short';
type OrderType = 'market' | 'limit';

const formatPrice = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value > 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`;
};

const formatPercent = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const DriftTrade = () => {
  const markets = useDriftMarketsStore((state) => state.markets);
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex);
  const selectMarket = useDriftMarketsStore((state) => state.selectMarket);
  const snapshots = useDriftMarketsStore((state) => state.snapshots);
  const chartData = useDriftMarketsStore((state) => state.chart.data);
  const chartLoading = useDriftMarketsStore((state) => state.chart.loading);

  const [direction, setDirection] = useState<PositionDirection>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [size, setSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [leverage, setLeverage] = useState(5);

  // Mock position data - will be replaced with real data
  const hasPosition = true;
  const mockPosition = {
    direction: 'long' as const,
    size: 2.5,
    entryPrice: 145.2,
    pnl: 125.5,
    pnlPercent: 5.2,
  };

  const selectedMarket = useMemo(() => {
    return markets.find((m) => m.marketIndex === selectedMarketIndex);
  }, [markets, selectedMarketIndex]);

  const snapshot = selectedMarketIndex !== null ? snapshots[selectedMarketIndex] : undefined;
  const currentPrice = snapshot?.markPrice || 0;
  const change24h = snapshot?.change24hPct;

  const handleMarketChange = (marketIndexStr: string) => {
    selectMarket(parseInt(marketIndexStr));
  };

  const usdValue = useMemo(() => {
    const sizeNum = parseFloat(size) || 0;
    return sizeNum * currentPrice;
  }, [size, currentPrice]);

  const leverageValue = leverage;
  const estimatedEntry = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const requiredMargin = usdValue / leverageValue || 0;
  const estimatedLiqPrice = estimatedEntry * (1 - 1 / leverageValue);
  const estimatedFee = usdValue * 0.0006;

  const handleTrade = () => {
    console.log('Trade:', {
      market: selectedMarket?.symbol,
      direction,
      orderType,
      size,
      limitPrice: orderType === 'limit' ? limitPrice : undefined,
      leverage: leverageValue,
    });
  };

  return (
    <div>
      {/* Market Selector + Direction Buttons */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Select value={selectedMarketIndex?.toString() || ''} onValueChange={handleMarketChange}>
            <SelectTrigger className="w-full h-10 border border-input">
              <SelectValue placeholder="Select market">
                {selectedMarket && (
                  <div className="flex flex-col items-start gap-0">
                    <div className="font-medium text-xs">{selectedMarket.symbol}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatPrice(currentPrice)}
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => {
                const snap = snapshots[market.marketIndex];
                return (
                  <SelectItem key={market.marketIndex} value={market.marketIndex.toString()}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="font-medium">{market.symbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(snap?.markPrice)}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'col-span-4 h-10 font-bold',
            direction === 'long' && 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500'
          )}
          onClick={() => setDirection('long')}
        >
          <TrendingUp className="mr-1 h-4 w-4" />
          LONG
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            'col-span-4 h-10 font-bold',
            direction === 'short' && 'bg-red-500 text-white hover:bg-red-600 border-red-500'
          )}
          onClick={() => setDirection('short')}
        >
          <TrendingDown className="mr-1 h-4 w-4" />
          SHORT
        </Button>
      </div>

      {/* Trade Form */}
      <Card className="flex-1 rounded-lg border-border/40 p-3 overflow-y-auto">
        <div className="space-y-3">

          {/* Order Type (Select) + Leverage Slider */}
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-4">
              <Select value={orderType} onValueChange={(value: OrderType) => setOrderType(value)}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Order Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-8 flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Leverage</label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue"
              />
              <span className="text-sm font-bold text-primary min-w-[30px]">{leverageValue}x</span>
            </div>
          </div>

          {/* Limit Price (conditional) */}
          {orderType === 'limit' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Limit Price</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="pr-12 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  USD
                </span>
              </div>
            </div>
          )}

          {/* Size Input */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Size</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="pr-12 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {selectedMarket?.baseAssetSymbol || 'ETH'}
              </span>
            </div>
            <p className="text-xs text-right text-muted-foreground">
              ≈ ${usdValue.toFixed(2)} USD
            </p>
          </div>

          {/* Trade Button */}
          <Button
            type="button"
            className={cn(
              'w-full h-10 font-bold',
              direction === 'long'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-red-500 hover:bg-red-600'
            )}
            onClick={handleTrade}
            disabled={!size || parseFloat(size) <= 0}
          >
            OPEN {direction.toUpperCase()} POSITION
          </Button>

          {/* Order Summary - Inline 2 rows */}
          <div className="space-y-1 rounded-lg border border-border/40 bg-muted/20 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Entry: {formatPrice(estimatedEntry)}</span>
              <span className="text-orange-400">Liq: {formatPrice(estimatedLiqPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Margin: ${requiredMargin.toFixed(2)}
              </span>
              <span className="text-muted-foreground">Fee: ~${estimatedFee.toFixed(2)}</span>
            </div>
          </div>

          {/* Risk Warning */}
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-2 flex items-start gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0 text-orange-400 mt-0.5" />
            <p className="text-xs text-orange-400">
              Trading perpetuals involves significant risk. You could lose your entire margin.
            </p>
          </div>
        </div>
      </Card>

      {/* Position Badge (inline - compact) */}
      {hasPosition && (
        <div
          className={cn(
            'rounded-lg border px-2 py-1 text-xs flex items-center justify-between',
            mockPosition.direction === 'long'
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-red-500/30 bg-red-500/5'
          )}
        >
          <div className="flex items-center gap-2">
            {mockPosition.direction === 'long' ? (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-400" />
            )}
            <span className="font-semibold text-primary">
              {mockPosition.direction.toUpperCase()} {mockPosition.size}{' '}
              {selectedMarket?.baseAssetSymbol}
            </span>
            <span className="text-muted-foreground">• Entry ${mockPosition.entryPrice}</span>
          </div>
          <span
            className={cn(
              'font-bold',
              mockPosition.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {mockPosition.pnl >= 0 ? '+' : ''}${mockPosition.pnl.toFixed(2)} (
            {mockPosition.pnlPercent >= 0 ? '+' : ''}
            {mockPosition.pnlPercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </div>
  );
};

export default DriftTrade;
