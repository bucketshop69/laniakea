import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';
import { useDappStore } from '@/store/dappStore';
import { useFetchPoolMetadata } from '@/modules/saros/hooks/useFetchPoolMetadata';

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

    const activeSarosPool = sarosState.selectedPool ?? sarosState.pools[0] ?? null;
    const sarosPoolAddress = isSaros ? activeSarosPool?.pairs[0]?.pair : undefined;
    const {
        metadata,
        price,
        baseAmount,
        quoteAmount,
        totalValueQuote,
        isLoading: sarosMetadataLoading,
        error: sarosMetadataError,
    } = useFetchPoolMetadata(sarosPoolAddress);

    const sarosLoading = isSaros && (sarosState.isLoading || sarosMetadataLoading);
    const sarosError = isSaros ? sarosState.error ?? sarosMetadataError : null;

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

    const displayPool = sarosDisplayPool ?? currentPool;
    const displaySelectedPool = sarosDisplayPool?.pair ?? fallbackPoolLabel;

    const displayChartData = useMemo(() => {
        if (!isSaros || !activeSarosPool) {
            return chartData;
        }

        const priceNumber = price ? Number(price) : undefined;
        if (!priceNumber || !Number.isFinite(priceNumber) || priceNumber <= 0) {
            return chartData;
        }

        const base = priceNumber;
        const variation = base * 0.02 || 0.01;
        return Array.from({ length: 7 }, (_, index) => {
            const angle = (index / 6) * Math.PI;
            const delta = Math.sin(angle) * variation;
            return {
                time: `${index * 4}:00`,
                price: Number((base + delta).toFixed(6)),
                volume: activeSarosPool.volume24h ? activeSarosPool.volume24h / 7 : 0,
            };
        });
    }, [isSaros, activeSarosPool, price, chartData]);

    const priceFormatter = (value: number) => {
        if (displayPool.currentPrice > 1000) {
            return `$${value.toLocaleString()}`;
        }
        return `$${value.toFixed(4)}`;
    };

    const priceChangeClass = displayPool.priceChange24h.startsWith('+')
        ? 'text-blue'
        : displayPool.priceChange24h.startsWith('-')
            ? 'text-red-400'
            : 'text-muted-foreground';

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
                        <h2 className="text-xl font-bold text-primary mb-1">Pool Performance</h2>
                        <p className="text-sm">{displaySelectedPool} Price Chart</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                            {formatCurrency(displayPool.currentPrice)}
                        </p>
                        <p className={`text-sm ${priceChangeClass}`}>
                            {displayPool.priceChange24h} (24h)
                        </p>
                    </div>
                </div>

                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={displayChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis
                                dataKey="time"
                                stroke="#64748B"
                                fontSize={12}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#64748B"
                                fontSize={12}
                                domain={['dataMin - 0.01', 'dataMax + 0.01']}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={priceFormatter}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 6, fill: '#3B82F6', stroke: '#1E293B', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 cosmic-border">
                    <div className="text-center">
                        <p className="text-xs">24h Volume</p>
                        <p className="text-primary font-medium">{displayPool.volume24h}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs">24h High</p>
                        <p className="text-primary font-medium">{displayPool.high24h}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs">24h Low</p>
                        <p className="text-primary font-medium">{displayPool.low24h}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Stats;
