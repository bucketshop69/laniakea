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
import { Card } from './ui/card';
import { useDappStore } from '@/store/dappStore';
import { useFetchPoolMetadata } from '@/modules/saros/hooks/useFetchPoolMetadata';
import { useFetchOverviewChart } from '@/modules/saros/hooks/useFetchOverviewChart';
import { useFetchBinDistribution } from '@/modules/saros/hooks/useFetchBinDistribution';

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
    const sarosState = useDappStore((state) => state.saros);
    const isSaros = selectedDapp === 'saros';

    const activeSarosPool = sarosState.selectedPool ?? null;
    const sarosPoolAddress = isSaros && activeSarosPool ? activeSarosPool.pairs[0]?.pair : undefined;
    const {
        price,
        baseAmount,
        quoteAmount,
        totalValueQuote,
        isLoading: sarosMetadataLoading,
        error: sarosMetadataError,
    } = useFetchPoolMetadata(sarosPoolAddress);

    const shouldUseOverviewChart = isSaros && !activeSarosPool;
    const {
        data: sarosOverviewChart,
        isLoading: sarosOverviewChartLoading,
        error: sarosOverviewChartError,
    } = useFetchOverviewChart({ enabled: shouldUseOverviewChart });

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

    const {
        data: binDistribution,
        isLoading: binDistributionLoading,
        error: binDistributionError,
    } = useFetchBinDistribution(binDistributionParams);

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

    const displayMetrics = useMemo(() => {
        if (!isSaros || !activeSarosPool) {
            return null;
        }

        return [
            {
                label: 'TVL',
                value: formatCurrency(activeSarosPool.totalLiquidity),
            },
            {
                label: 'Pool Liquidity',
                value: formatCurrency(totalValueQuote ?? activeSarosPool.totalLiquidity),
                subLabel: baseAmount !== null && quoteAmount !== null
                    ? `${baseAmount.toFixed(2)} ${activeSarosPool.tokenX.symbol} • ${quoteAmount.toFixed(2)} ${activeSarosPool.tokenY.symbol}`
                    : undefined,
            },
            {
                label: 'APR (24h)',
                value: formatPercent(activeSarosPool.apr24h),
            },
            {
                label: 'Volume (24h)',
                value: formatCurrency(activeSarosPool.volume24h),
            },
        ];
    }, [isSaros, activeSarosPool, totalValueQuote, baseAmount, quoteAmount]);

    const fallbackPoolLabel = selectedPool;

    const sarosDisplayPool: Pool | null = useMemo(() => {
        if (!isSaros || !activeSarosPool) {
            return null;
        }

        const priceNumber = price ? Number(price) : undefined;

        return {
            pair: `${activeSarosPool.tokenX.symbol}/${activeSarosPool.tokenY.symbol}`,
            apy: formatPercent(activeSarosPool.apr24h),
            tvl: formatCurrency(activeSarosPool.totalLiquidity),
            fee: '—',
            currentPrice: priceNumber ?? 0,
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

    const chartTitle = shouldUseOverviewChart
        ? 'Protocol Liquidity Overview'
        : 'Pool Liquidity Distribution';
    const chartSubtitle = shouldUseOverviewChart
        ? 'Saros Liquidity Chart'
        : `${displaySelectedPool} Liquidity by Bin`;

    const activeBinId = primaryPair?.activeBin ?? null;

    const displayChartData = useMemo<ChartDataPoint[]>(() => {
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
    }, [shouldUseOverviewChart, sarosOverviewChart, binDistribution, chartData, activeBinId]);

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

    const chartErrorMessage = shouldUseOverviewChart ? sarosOverviewChartError : binDistributionError;
    const shouldShowEmptyState = isSaros && !shouldUseOverviewChart && !sarosLoading && !chartErrorMessage && displayChartData.length === 0;

    const priceChangeValue = displayPool.priceChange24h ?? '—';
    const priceChangeClass = priceChangeValue.startsWith('+')
        ? 'text-blue'
        : priceChangeValue.startsWith('-')
            ? 'text-red-400'
            : 'text-muted-foreground';

    const primaryStatValue = shouldUseOverviewChart
        ? formatCurrency(sarosOverviewDisplay?.currentPrice ?? null)
        : formatCurrency(displayPool.currentPrice);
    const secondaryStatText = shouldUseOverviewChart
        ? `${sarosOverviewDisplay?.volume24h ?? '—'} (24h Volume)`
        : `${priceChangeValue} (24h)`;
    const secondaryStatClass = shouldUseOverviewChart ? 'text-muted-foreground' : priceChangeClass;

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
                {isSaros && (
                    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                        {displayMetrics?.map((metric) => (
                            <div key={metric.label} className="rounded-lg border border-border/40 bg-card/70 p-3">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                                <p className="mt-1 text-sm font-semibold text-primary">{metric.value}</p>
                                {metric.subLabel && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">{metric.subLabel}</p>
                                )}
                            </div>
                        ))}
                        {sarosLoading && (
                            <div className="col-span-2 md:col-span-4 rounded-lg border border-dashed border-border/40 p-3 text-sm text-muted-foreground">
                                Loading Saros statistics…
                            </div>
                        )}
                        {sarosError && !sarosLoading && (
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
                    {shouldUseOverviewChart && sarosOverviewChartLoading ? (
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
