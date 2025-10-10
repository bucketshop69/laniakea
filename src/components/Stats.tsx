import React, { useEffect, useMemo } from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Bar,
    Tooltip,
    ReferenceLine,
    Cell,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { getPriceFromId } from '@saros-finance/dlmm-sdk/utils/price';
import { Card } from './ui/card';
import { useDappStore } from '@/store/dappStore';
import { useSarosDataStore } from '@/modules/saros/state';
import { useSarosPoolMetadata } from '@/modules/saros/hooks/useFetchPoolMetadata';
import { useSarosOverviewChart } from '@/modules/saros/hooks/useFetchOverviewChart';
import { useSarosBinDistribution } from '@/modules/saros/hooks/useFetchBinDistribution';
import { useDriftMarketsStore } from '@/modules/drift/state';
import { Button } from './ui/button';
import type { CandleResolution } from '@drift-labs/sdk';
import { DriftCandlestickChart } from '@/modules/drift/components/DriftCandlestickChart';

interface Pool {
    pair: string;
    apy: string;
    tvl: string;
    fee: string;
    currentPrice: number;
    priceChange24h: string;
    volume24h: string;
    high24h: string;
    low24h: string;
}

interface ChartDataPoint {
    time: string;
    price: number;
    volume: number;
    reserveBase?: number;
    reserveQuote?: number;
    binId?: number;
    isActive?: boolean;
}

interface StatsProps {
    selectedPool: string;
    currentPool: Pool;
    chartData: ChartDataPoint[];
}

const formatCurrency = (value?: number | null, options: Intl.NumberFormatOptions = {}) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: value >= 1 ? 2 : 6,
        notation: value >= 1_000_000 ? 'compact' : 'standard',
        ...options,
    }).format(value);
};

const formatPercent = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }
    return `${value.toFixed(2)}%`;
};

const Stats: React.FC<StatsProps> = ({ selectedPool, currentPool, chartData }) => {
    const selectedDapp = useDappStore((state) => state.selectedDapp);
    const sarosState = useSarosDataStore((state) => state.data);
    const isSaros = selectedDapp === 'saros';
    const isDrift = selectedDapp === 'drift';

    const activeSarosPool = sarosState.selectedPool ?? null;
    const sarosPoolAddress = isSaros && activeSarosPool ? activeSarosPool.pairs[0]?.pair : undefined;
    const {
        snapshot: sarosSnapshot,
        isLoading: sarosMetadataLoading,
        error: sarosMetadataError,
    } = useSarosPoolMetadata({ poolAddress: sarosPoolAddress, enabled: Boolean(sarosPoolAddress) });

    const driftMarkets = useDriftMarketsStore((state) => state.markets);
    const driftSelectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex);
    const driftSnapshots = useDriftMarketsStore((state) => state.snapshots);
    const driftChartData = useDriftMarketsStore((state) => state.chart.data);
    const driftChartLoading = useDriftMarketsStore((state) => state.chart.loading);
    const driftChartError = useDriftMarketsStore((state) => state.chart.error);
    const driftChartResolution = useDriftMarketsStore((state) => state.chart.resolution);
    const setDriftChartResolution = useDriftMarketsStore((state) => state.setChartResolution);

    const selectedDriftMarket = driftMarkets.find((m) => m.marketIndex === driftSelectedMarketIndex);
    const selectedDriftSnapshot = driftSelectedMarketIndex !== null ? driftSnapshots[driftSelectedMarketIndex] : null;

    const resolutionOptions: Array<{ label: string; value: CandleResolution }> = [
        { label: '1m', value: '1' },
        { label: '5m', value: '5' },
        { label: '15m', value: '15' },
        { label: '1h', value: '60' },
        { label: '1D', value: 'D' },
    ];

    const baseAmount = sarosSnapshot?.baseReserve ?? null;
    const quoteAmount = sarosSnapshot?.quoteReserve ?? null;
    const totalValueQuote = sarosSnapshot?.totalValueQuote ?? null;

    const shouldUseOverviewChart = isSaros && !activeSarosPool;
    const {
        data: sarosOverviewChart,
        isLoading: sarosOverviewChartLoading,
        error: sarosOverviewChartError,
    } = useSarosOverviewChart({ enabled: shouldUseOverviewChart });

    const primaryPair = activeSarosPool?.pairs?.[0];
    const baseTokenDecimals = activeSarosPool?.tokenX.decimals;
    const quoteTokenDecimals = activeSarosPool?.tokenY.decimals;
    const baseSymbol = activeSarosPool?.tokenX.symbol ?? '';
    const quoteSymbol = activeSarosPool?.tokenY.symbol ?? '';

    const binDistributionParams = useMemo(() => {
        if (shouldUseOverviewChart || !primaryPair || baseTokenDecimals == null || quoteTokenDecimals == null) {
            return undefined;
        }

        if (!primaryPair.pair || typeof primaryPair.activeBin !== 'number' || typeof primaryPair.binStep !== 'number') {
            return undefined;
        }

        return {
            pairAddress: primaryPair.pair,
            activeBin: primaryPair.activeBin,
            binStep: primaryPair.binStep,
            baseDecimals: baseTokenDecimals,
            quoteDecimals: quoteTokenDecimals,
            range: 50,
        } as const;
    }, [shouldUseOverviewChart, primaryPair, baseTokenDecimals, quoteTokenDecimals]);

    const binDistributionConfig = useMemo(() => {
        if (!binDistributionParams) {
            return { enabled: false } as const;
        }
        return { ...binDistributionParams, enabled: true } as const;
    }, [binDistributionParams]);

    const activeBinPrice = useMemo(() => {
        if (!primaryPair || baseTokenDecimals == null || quoteTokenDecimals == null) {
            return null;
        }

        if (!primaryPair.pair || typeof primaryPair.activeBin !== 'number' || typeof primaryPair.binStep !== 'number') {
            return null;
        }

        return getPriceFromId(primaryPair.binStep, primaryPair.activeBin, baseTokenDecimals, quoteTokenDecimals);
    }, [primaryPair, baseTokenDecimals, quoteTokenDecimals]);

    const price = activeBinPrice ?? sarosSnapshot?.price ?? null;

    const {
        data: binDistribution,
        isLoading: binDistributionLoading,
        error: binDistributionError,
    } = useSarosBinDistribution(binDistributionConfig);

    const sarosLoading = isSaros && (
        sarosState.isLoading
        || sarosMetadataLoading
        || (shouldUseOverviewChart && sarosOverviewChartLoading)
        || (!shouldUseOverviewChart && binDistributionLoading)
    );
    const sarosError = isSaros
        ? sarosState.error
        ?? sarosMetadataError
        ?? (shouldUseOverviewChart ? sarosOverviewChartError : binDistributionError)
        : null;
    const fallbackPoolLabel = selectedPool;

    const sarosDisplayPool: Pool | null = useMemo(() => {
        if (!isSaros || !activeSarosPool) {
            return null;
        }

        return {
            pair: `${activeSarosPool.tokenX.symbol}/${activeSarosPool.tokenY.symbol}`,
            apy: formatPercent(activeSarosPool.apr24h),
            tvl: formatCurrency(activeSarosPool.totalLiquidity),
            fee: '—',
            currentPrice: price ?? 0,
            priceChange24h: '—',
            volume24h: formatCurrency(activeSarosPool.volume24h),
            high24h: '—',
            low24h: '—',
        };
    }, [isSaros, activeSarosPool, price]);

    const sarosOverviewDisplay: Pool | null = useMemo(() => {
        if (!shouldUseOverviewChart || sarosOverviewChart.length === 0) {
            return null;
        }

        const latestPoint = sarosOverviewChart[sarosOverviewChart.length - 1];
        const currentPrice = Number.isFinite(latestPoint?.liquidity) ? latestPoint.liquidity : 0;
        const volume24h = Number.isFinite(latestPoint?.volume) ? latestPoint.volume : 0;

        return {
            pair: 'Saros Overview',
            apy: '—',
            tvl: '—',
            fee: '—',
            currentPrice,
            priceChange24h: '—',
            volume24h: formatCurrency(volume24h),
            high24h: '—',
            low24h: '—',
        };
    }, [shouldUseOverviewChart, sarosOverviewChart]);

    const displayPool = sarosDisplayPool ?? sarosOverviewDisplay ?? currentPool;
    const displaySelectedPool = sarosDisplayPool?.pair ?? sarosOverviewDisplay?.pair ?? fallbackPoolLabel;

    const driftChartTitle = selectedDriftMarket ? `${selectedDriftMarket.symbol} Price Chart` : 'Drift Market Chart';
    const driftChartSubtitle = selectedDriftMarket ? selectedDriftMarket.fullName ?? selectedDriftMarket.baseAssetSymbol : 'Select a market';

    const chartTitle = isDrift
        ? driftChartTitle
        : shouldUseOverviewChart
            ? 'Protocol Liquidity Overview'
            : 'Pool Liquidity Distribution';
    const chartSubtitle = isDrift
        ? driftChartSubtitle
        : shouldUseOverviewChart
            ? 'Saros Liquidity Chart'
            : `${displaySelectedPool} Liquidity by Bin`;

    const activeBinId = primaryPair?.activeBin ?? null;

    const displayChartData = useMemo<ChartDataPoint[]>(() => {
        if (isDrift) {
            return driftChartData.map((candle) => ({
                time: new Date(candle.time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                price: candle.close,
                volume: candle.volume,
            }));
        }

        if (!isSaros) {
            return chartData;
        }

        if (shouldUseOverviewChart) {
            if (sarosOverviewChart.length === 0) {
                return chartData;
            }

            const normalized = sarosOverviewChart
                .map<ChartDataPoint>((point) => {
                    const timestamp = new Date(point.date);
                    const isValidDate = Number.isFinite(timestamp.getTime());
                    return {
                        time: isValidDate
                            ? timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : point.date,
                        price: point.liquidity,
                        volume: point.volume,
                    };
                })
                .filter((point) => Number.isFinite(point.price) && Number.isFinite(point.volume));

            return normalized.length > 0 ? normalized : chartData;
        }

        if (binDistribution.length === 0) {
            return [];
        }

        return binDistribution.map<ChartDataPoint>((point) => {
            const quoteLiquidity = (Number.isFinite(point.price) ? point.price * point.reserveBase : 0) + point.reserveQuote;
            const delta = activeBinId != null ? point.binId - activeBinId : 0;
            return {
                time: delta.toString(),
                price: point.price,
                volume: quoteLiquidity,
                reserveBase: point.reserveBase,
                reserveQuote: point.reserveQuote,
                binId: point.binId,
                isActive: activeBinId != null && point.binId === activeBinId,
            };
        });
    }, [isDrift, driftChartData, shouldUseOverviewChart, sarosOverviewChart, binDistribution, chartData, activeBinId]);

    const formatPriceAxis = (value: number) => (
        shouldUseOverviewChart
            ? formatCurrency(value)
            : value.toLocaleString('en-US', { maximumFractionDigits: value >= 1 ? 4 : 8 })
    );

    const formatVolumeAxis = (value: number) => (
        shouldUseOverviewChart
            ? formatCurrency(value)
            : value.toLocaleString('en-US', { maximumFractionDigits: value >= 1 ? 2 : 6 })
    );

    type EnhancedTooltipProps = TooltipProps<ValueType, NameType> & {
        payload?: Array<({ name?: NameType; value?: ValueType } & { payload?: ChartDataPoint })>;
    };

    const renderTooltip = (tooltipProps: TooltipProps<ValueType, NameType>) => {
        const tooltipActive = tooltipProps.active;
        const tooltipLabel = (tooltipProps as { label?: string | number }).label;
        const { payload: tooltipPayload } = tooltipProps as EnhancedTooltipProps;
        if (!tooltipActive || !tooltipPayload || tooltipPayload.length === 0) {
            return null;
        }

        if (shouldUseOverviewChart) {
            return (
                <div className="rounded-md border border-border/60 bg-slate-900/90 p-3 text-xs text-muted-foreground">
                    <p className="mb-2 font-semibold text-primary">{tooltipLabel}</p>
                    {tooltipPayload.map((entry) => {
                        const entryName = (typeof entry.name === 'string' ? entry.name : String(entry.name ?? ''));
                        const entryValue = typeof entry.value === 'number' ? entry.value : Number(entry.value ?? 0);
                        return (
                            <div key={entryName} className="flex items-center justify-between gap-4">
                                <span>{entryName}</span>
                                <span className="text-primary">{formatCurrency(entryValue)}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        const point = tooltipPayload[0]?.payload ?? null;
        if (!point) {
            return null;
        }

        const delta = Number(tooltipLabel);
        const deltaLabel = Number.isNaN(delta)
            ? tooltipLabel
            : delta === 0
                ? 'Active Bin'
                : `Δ Bin ${delta}`;
        const priceLabel = point.price.toLocaleString('en-US', { maximumFractionDigits: point.price >= 1 ? 4 : 8 });
        const baseAmount = (point.reserveBase ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 });
        const quoteAmount = (point.reserveQuote ?? 0).toLocaleString('en-US', { maximumFractionDigits: 4 });
        const liquidity = (point.volume ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

        return (
            <div className="rounded-md border border-border/60 bg-slate-900/90 p-3 text-xs text-muted-foreground">
                <p className="mb-2 font-semibold text-primary">{deltaLabel}</p>
                {point.binId != null && (
                    <div className="mb-1 flex items-center justify-between gap-4">
                        <span>Bin ID</span>
                        <span className="text-primary">{point.binId}</span>
                    </div>
                )}
                <div className="flex items-center justify-between gap-4">
                    <span>Price</span>
                    <span className="text-primary">
                        {priceLabel}
                        {quoteSymbol ? ` ${quoteSymbol}` : ''}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span>Base Liquidity</span>
                    <span className="text-primary">
                        {baseAmount}
                        {baseSymbol ? ` ${baseSymbol}` : ''}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span>Quote Liquidity</span>
                    <span className="text-primary">
                        {quoteAmount}
                        {quoteSymbol ? ` ${quoteSymbol}` : ''}
                    </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-4 border-t border-border/40 pt-2">
                    <span>Total (quote)</span>
                    <span className="text-primary">
                        {liquidity}
                        {quoteSymbol ? ` ${quoteSymbol}` : ''}
                    </span>
                </div>
            </div>
        );
    };

    const xTickFormatter = (value: string) => {
        if (shouldUseOverviewChart) {
            return value;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return value;
        }
        if (numeric === 0) {
            return '0';
        }
        return numeric > 0 ? `+${numeric}` : numeric.toString();
    };

    const chartErrorMessage = isDrift
        ? driftChartError
        : shouldUseOverviewChart
            ? sarosOverviewChartError
            : binDistributionError;
    const chartIsLoading = isDrift
        ? driftChartLoading
        : shouldUseOverviewChart
            ? sarosOverviewChartLoading
            : false;
    const shouldShowEmptyState = isDrift
        ? !driftChartLoading && !driftChartError && displayChartData.length === 0
        : isSaros && !shouldUseOverviewChart && !sarosLoading && !chartErrorMessage && displayChartData.length === 0;

    const priceChangeValue = displayPool.priceChange24h ?? '—';
    const priceChangeClass = priceChangeValue.startsWith('+')
        ? 'text-blue'
        : priceChangeValue.startsWith('-')
            ? 'text-red-400'
            : 'text-muted-foreground';

    const driftPriceChangeValue = formatPercent(selectedDriftSnapshot?.change24hPct);
    const driftPriceChangeClass = selectedDriftSnapshot?.change24hPct !== undefined && selectedDriftSnapshot.change24hPct >= 0
        ? 'text-emerald-400'
        : 'text-red-400';

    const primaryStatValue = isDrift
        ? formatCurrency(selectedDriftSnapshot?.markPrice)
        : shouldUseOverviewChart
            ? formatCurrency(sarosOverviewDisplay?.currentPrice ?? null)
            : formatCurrency(displayPool.currentPrice);
    const secondaryStatText = isDrift
        ? `${driftPriceChangeValue} (24h)`
        : shouldUseOverviewChart
            ? `${sarosOverviewDisplay?.volume24h ?? '—'} (24h Volume)`
            : `${priceChangeValue} (24h)`;
    const secondaryStatClass = isDrift
        ? driftPriceChangeClass
        : shouldUseOverviewChart
            ? 'text-muted-foreground'
            : priceChangeClass;

    useEffect(() => {
        if (!isSaros) {
            return;
        }

        console.log('Stats chart data', {
            mode: shouldUseOverviewChart ? 'protocol-overview' : 'pool-selected',
            poolPair: shouldUseOverviewChart ? 'Saros Overview' : sarosDisplayPool?.pair ?? fallbackPoolLabel,
            points: displayChartData,
            lineValues: displayChartData.map((point) => point.price),
            volumeValues: displayChartData.map((point) => point.volume),
            rawBinDistribution: shouldUseOverviewChart ? undefined : binDistribution,
        });
    }, [isSaros, shouldUseOverviewChart, displayChartData, sarosDisplayPool, fallbackPoolLabel, binDistribution]);

    return (
        <Card className="col-start-1 col-span-7 w-full">
            <div className="flex flex-col">
                {(isSaros || isDrift) && (
                    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {isSaros && sarosLoading && (
                            <div className="col-span-2 md:col-span-4 rounded-lg border border-dashed border-border/40 p-3 text-sm text-muted-foreground">
                                Loading Saros statistics…
                            </div>
                        )}
                        {isSaros && sarosError && !sarosLoading && (
                            <div className="col-span-2 md:col-span-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                Failed to load Saros statistics. {sarosError}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-primary mb-1">{chartTitle}</h2>
                        <p className="text-sm">{chartSubtitle}</p>
                        {isDrift && (
                            <div className="flex gap-1 mt-2">
                                {resolutionOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={driftChartResolution === option.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setDriftChartResolution(option.value)}
                                        className="h-7 px-2 text-xs"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                            {primaryStatValue}
                        </p>
                        <p className={`text-sm ${secondaryStatClass}`}>
                            {secondaryStatText}
                        </p>
                    </div>
                </div>

                <div className="chart-wrapper">
                    {isDrift ? (
                        <DriftCandlestickChart
                            key={selectedDriftMarket?.marketIndex ?? 'drift-chart'}
                            data={driftChartData}
                            isLoading={driftChartLoading}
                        />
                    ) : chartIsLoading ? (
                        <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
                            Loading Saros chart data…
                        </div>
                    ) : chartErrorMessage ? (
                        <div className="flex h-[320px] items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-sm text-red-300">
                            Failed to load Saros chart data. {chartErrorMessage}
                        </div>
                    ) : shouldShowEmptyState ? (
                        <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border/40 text-sm text-muted-foreground">
                            No liquidity data to display.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={520}>
                            <ComposedChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="time"
                                    stroke="#64748B"
                                    fontSize={12}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={xTickFormatter}
                                />
                                <YAxis
                                    yAxisId="liquidity"
                                    stroke="#64748B"
                                    fontSize={12}
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatPriceAxis}
                                />
                                <YAxis
                                    yAxisId="volume"
                                    orientation="right"
                                    stroke="#64748B"
                                    fontSize={12}
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatVolumeAxis}
                                />
                                <Bar
                                    yAxisId="volume"
                                    dataKey="volume"
                                    fill="#22D3EE"
                                    opacity={0.45}
                                    radius={[4, 4, 0, 0]}
                                    name={shouldUseOverviewChart ? 'Volume (24h)' : `Total Liquidity${quoteSymbol ? ` (${quoteSymbol})` : ''}`}
                                >
                                    {!shouldUseOverviewChart && displayChartData.map((point) => (
                                        <Cell key={point.time} fill={point.isActive ? '#F97316' : '#22D3EE'} />
                                    ))}
                                </Bar>
                                {!shouldUseOverviewChart && (
                                    <ReferenceLine x="0" stroke="#F97316" strokeDasharray="3 3" />
                                )}
                                {shouldUseOverviewChart && (
                                    <Line
                                        yAxisId="liquidity"
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, fill: '#3B82F6', stroke: '#1E293B', strokeWidth: 2 }}
                                        name="Liquidity"
                                    />
                                )}
                                <Tooltip
                                    content={renderTooltip}
                                    cursor={{ stroke: '#1E293B', strokeWidth: 1 }}
                                    wrapperStyle={{ outline: 'none' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default Stats;
