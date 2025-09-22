import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card } from './ui/card';

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

const Stats: React.FC<StatsProps> = ({ selectedPool, currentPool, chartData }) => {
    return (
        <Card className="col-start-2 col-span-6 w-full">
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-primary mb-1">Pool Performance</h2>
                        <p className="text-sm">{selectedPool} Price Chart</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                            ${selectedPool === 'ETH/USDC' ? currentPool.currentPrice.toFixed(4) : currentPool.currentPrice.toLocaleString()}
                        </p>
                        <p className={`text-sm ${currentPool.priceChange24h.startsWith('+') ? 'text-blue' : 'text-red-400'}`}>
                            {currentPool.priceChange24h} (24h)
                        </p>
                    </div>
                </div>

                <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                                tickFormatter={(value) =>
                                    currentPool.currentPrice > 1000 ?
                                        `$${value.toLocaleString()}` :
                                        `$${value.toFixed(4)}`
                                }
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
                        <p className="text-primary font-medium">{currentPool.volume24h}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs">24h High</p>
                        <p className="text-primary font-medium">{currentPool.high24h}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs">24h Low</p>
                        <p className="text-primary font-medium">{currentPool.low24h}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default Stats;
