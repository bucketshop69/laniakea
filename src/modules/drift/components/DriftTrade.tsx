import { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
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
import { useDriftMarketsStore, useDriftSessionStore, useDriftPositionsStore } from '../state';
import {
  initializeUserAccount,
  previewTrade,
  executeMarketPerpOrder,
  executeLimitPerpOrder,
  getAccountMetrics,
  type TradePreviewResult,
} from '../services/driftPositionService';
import { useDriftPositionsStore as usePositionsStoreRef } from '../state/driftPositionsStore';
import DriftDepositModal from './DriftDepositModal';
import DriftPositions from './DriftPositions';

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
  const wallet = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const markets = useDriftMarketsStore((state) => state.markets);
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex);
  const selectMarket = useDriftMarketsStore((state) => state.selectMarket);
  const snapshots = useDriftMarketsStore((state) => state.snapshots);

  const clientReady = useDriftSessionStore((state) => state.clientReady);
  const readOnly = useDriftSessionStore((state) => state.readOnly);

  const [direction, setDirection] = useState<PositionDirection>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [size, setSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [sizeMode, setSizeMode] = useState<'asset' | 'usdc'>('asset');
  const [percent, setPercent] = useState(0);

  const selectedMarket = useMemo(() => {
    return markets.find((m) => m.marketIndex === selectedMarketIndex);
  }, [markets, selectedMarketIndex]);

  const snapshot = selectedMarketIndex !== null ? snapshots[selectedMarketIndex] : undefined;
  const currentPrice = snapshot?.markPrice || 0;

  const userExists = useDriftPositionsStore((s) => s.userExists);
  const usdcBalance = useDriftPositionsStore((s) => s.usdcBalance);
  const freeCollateral = useDriftPositionsStore((s) => s.freeCollateral);
  const buyingPower = useDriftPositionsStore((s) => s.buyingPower);
  const leverageRatio = useDriftPositionsStore((s) => s.leverage);
  const [creatingUser, setCreatingUser] = useState(false);
  const [preview, setPreview] = useState<TradePreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  const handleMarketChange = (marketIndexStr: string) => {
    selectMarket(parseInt(marketIndexStr));
  };

  const usdValue = useMemo(() => {
    const sizeNum = parseFloat(size) || 0;
    if (sizeMode === 'asset') return sizeNum * currentPrice;
    return sizeNum;
  }, [size, currentPrice, sizeMode]);

  const estimatedEntry = orderType === 'market' ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const estimatedFeeFallback = usdValue * 0.0006;

  const handlePercent = (pct: number) => {
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) return;
    const bp = typeof buyingPower === 'number' ? buyingPower : 0;
    if (bp <= 0) return;
    const notional = (pct / 100) * bp;
    if (sizeMode === 'usdc') {
      setSize(notional.toFixed(2));
    } else {
      const base = notional / currentPrice;
      setSize(Number.isFinite(base) ? base.toFixed(6) : '');
    }
  };

  // no explicit leverage control; leverage is derived in preview

  const handlePreview = async () => {
    if (!wallet.connected) {
      setWalletModalVisible(true);
      return;
    }
    if (readOnly || !clientReady) {
      // Client still initializing, silently wait
      return;
    }
    if (userExists !== true) {
      console.warn('No Drift user found. Initialize account to preview trades.');
      return;
    }
    if (selectedMarketIndex === null || typeof currentPrice !== 'number' || currentPrice <= 0) {
      // No market selected yet, silently skip
      return;
    }
    const sizeValue = parseFloat(size);
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) {
      // No valid size entered yet, silently skip preview
      return;
    }

    try {
      const result = await previewTrade({
        marketIndex: selectedMarketIndex,
        direction,
        orderType,
        size: sizeValue,
        sizeMode,
        markPrice: currentPrice,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) || undefined : undefined,
      });
      setPreview(result);
      setPreviewError(null);
      console.log('[Drift] trade preview', result);
      console.log('[Drift] order params', result.params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to preview trade';
      setPreview(null);
      setPreviewError(message);
      console.error('[Drift] trade preview failed', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void handlePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [direction, orderType, size, sizeMode, limitPrice, selectedMarketIndex, clientReady, wallet.connected, userExists]);

  const handleTrade = async () => {
    if (!wallet.connected || readOnly || !clientReady || userExists !== true) {
      console.warn('Trading not ready: connect wallet, initialize Drift user, or wait for session.');
      return;
    }
    if (selectedMarketIndex === null || typeof currentPrice !== 'number' || currentPrice <= 0) {
      console.warn('No market selected or invalid price');
      return;
    }
    const sizeValue = parseFloat(size);
    if (!Number.isFinite(sizeValue) || sizeValue <= 0) {
      console.warn('Enter a valid trade size');
      return;
    }
    setSubmitting(true);
    try {
      const localPreview = await previewTrade({
        marketIndex: selectedMarketIndex,
        direction,
        orderType,
        size: sizeValue,
        sizeMode,
        markPrice: currentPrice,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) || undefined : undefined,
      });
      if (localPreview.warnings.length > 0) {
        console.warn('Cannot submit trade due to warnings');
        setPreview(localPreview);
        setSubmitting(false);
        return;
      }
      const txSig = orderType === 'market'
        ? await executeMarketPerpOrder(localPreview.params)
        : await executeLimitPerpOrder(localPreview.params);
      console.log('[Drift] trade submitted', txSig);
      setPreview(null);
      setSize('');
      setPreviewError(null);
      const metrics = await getAccountMetrics(selectedMarketIndex ?? undefined);
      usePositionsStoreRef.getState().setMetrics(metrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Trade submission failed';
      setPreviewError(message);
      console.error('[Drift] trade submission failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const canTrade = wallet.connected && clientReady && !readOnly;
  const buttonLabel = !wallet.connected
    ? 'CONNECT WALLET'
    : !clientReady
      ? 'INITIALIZING…'
      : readOnly
        ? 'CONNECT WALLET'
        : `OPEN ${direction.toUpperCase()} POSITION`;

  return (
    <div>
      {wallet.connected && clientReady && userExists === false && (
        <div className="mb-2 flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            No Drift account found. Create one to start trading.
          </div>
          <Button
            size="sm"
            onClick={async () => {
              try {
                setCreatingUser(true)
                const { userAccount } = await initializeUserAccount()
                console.log('Drift user initialized:', userAccount.toBase58())
                const store = usePositionsStoreRef.getState()
                store.setUserExists(true)
                store.setUserReady(true)
                store.setUserAccountPubkey(userAccount.toBase58())
                const metrics = await getAccountMetrics(selectedMarketIndex ?? undefined)
                store.setMetrics(metrics)
              } catch (e) {
                console.error('Initialize user failed', e)
              } finally {
                setCreatingUser(false)
              }
            }}
            disabled={creatingUser}
          >
            {creatingUser ? 'Creating…' : 'Create Drift Account'}
          </Button>
        </div>
      )}

      {wallet.connected && clientReady && userExists === true && (
        <div className="mb-2 grid grid-cols-4 gap-2 text-xs">
          <Card className="p-2">
            <div className="text-muted-foreground">Free Collateral</div>
            <div className="font-semibold">{typeof freeCollateral === 'number' ? freeCollateral.toFixed(2) : '—'}</div>
          </Card>
          <Card className="p-2">
            <div className="text-muted-foreground">Buying Power</div>
            <div className="font-semibold">{typeof buyingPower === 'number' ? `$${buyingPower.toFixed(2)}` : '—'}</div>
          </Card>
          <Card className="p-2 flex items-center justify-between">
            <div>
              <div className="text-muted-foreground">Leverage</div>
              <div className="font-semibold">{typeof leverageRatio === 'number' ? `${leverageRatio.toFixed(2)}x` : '—'}</div>
            </div>
          </Card>
          <Button size="sm" variant="outline" onClick={() => setDepositOpen(true)}>Deposit</Button>
        </div>
      )}
      <DriftDepositModal open={depositOpen} onOpenChange={setDepositOpen} selectedMarketIndex={selectedMarketIndex} />
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
      <div className="mt-1">
        <div className="space-y-3">

          {/* Order Type + Percentage Slider (right aligned) */}
          <div className="grid grid-cols-12 gap-2 items-center">
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
            <div className="col-span-8 gap-2 justify-self-end">
              <span className="text-[11px] text-muted-foreground text-right">{percent}%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={percent}
                onChange={(e) => {
                  const p = parseInt(e.target.value) || 0;
                  setPercent(p);
                  handlePercent(p);
                }}
                className="h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-blue"
              />
              <div className="grid grid-cols-5 gap-1 text-[10px] text-muted-foreground">
                {['0%', '25%', '50%', '75%', '100%'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { const p = parseInt(t); setPercent(p); handlePercent(p); }}
                    className="hover:text-primary cursor-pointer"
                    title={`Set ${t} of buying power`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Limit Price Row (optional) */}
          <div className="grid grid-cols-12 gap-2 mb-1">
            {orderType === 'limit' ? (
              <div className="col-span-4">
                <Input
                  type="number"
                  placeholder="Limit Price"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="h-8 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ) : null}
          </div>

          {/* Size/Value Input */}
          <div className="space-y-1 mx-2">
            <div className="relative">
              <Input
                type="number"
                placeholder={sizeMode === 'asset' ? 'Size' : 'Value'}
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="pr-24 !text-xl h-18 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  const sizeNum = parseFloat(size);
                  const valid = Number.isFinite(sizeNum) && sizeNum > 0 && Number.isFinite(currentPrice) && currentPrice > 0;
                  if (sizeMode === 'asset') {
                    // Convert asset → USDC
                    const next = valid ? sizeNum * currentPrice : NaN;
                    setSize(Number.isFinite(next) ? next.toFixed(2) : size);
                    setSizeMode('usdc');
                  } else {
                    // Convert USDC → asset
                    const next = valid ? sizeNum / currentPrice : NaN;
                    setSize(Number.isFinite(next) ? next.toFixed(6) : size);
                    setSizeMode('asset');
                  }
                }}
              >
                <button
                  type="button"
                  className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  title="Switch between asset and USDC"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 16V4M7 4L3 8M7 4l4 4" />
                    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <span className="text-lg font-medium text-muted-foreground cursor-pointer">
                  {sizeMode === 'asset' ? selectedMarket?.baseAssetSymbol || 'ETH' : 'USDC'}
                </span>
              </div>
            </div>
            <p className="text-xs text-right text-muted-foreground">
              ≈ ${usdValue.toFixed(2)} USD
            </p>
          </div>

          {/* Order Summary - Inline 2 rows */}
          <div className="space-y-1 rounded-lg border border-border/40 bg-muted/20 p-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Entry: {formatPrice(preview?.limitPrice ?? preview?.executionPrice ?? estimatedEntry)}
              </span>
              <span className="text-orange-400">Liq: {preview?.liquidationPrice ? formatPrice(preview.liquidationPrice) : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Margin: {typeof preview?.marginRequired === 'number' ? `$${preview.marginRequired.toFixed(2)}` : '—'}
              </span>
              <span className="text-muted-foreground">
                Fee: ~${(preview?.feeEstimate ?? estimatedFeeFallback).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Trade Button */}
          <Button
            type="button"
            className={cn(
              'w-full h-10 font-bold',
              direction === 'long'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : 'bg-red-500 text-white hover:bg-red-600'
            )}
            onClick={handleTrade}
            disabled={
              buttonLabel === 'CONNECT WALLET' ? false :
                buttonLabel === 'INITIALIZING…' ? true :
                  !size || parseFloat(size) <= 0 || submitting || (preview?.warnings.length ?? 0) > 0
            }
          >
            {submitting ? 'Submitting…' : buttonLabel}
          </Button>
        </div>
      </div>

      {userExists === true && (
        <div className="mt-3">
          <div className="mb-1 text-xs text-muted-foreground">Open Positions</div>
          <DriftPositions marketIndex={selectedMarketIndex} />
        </div>
      )}
    </div>
  );
};

export default DriftTrade;
