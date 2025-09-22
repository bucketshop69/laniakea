import React, { useState, useEffect } from 'react';
import { Rocket, Star } from 'lucide-react';
import Stats from './components/Stats';
import ActionPanel from './components/ActionPanel';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  delay: number;
}

const SpaceLiquidityPool = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedPool, setSelectedPool] = useState('ETH/USDC');

  // Available pools
  const pools = [
    { pair: 'ETH/USDC', apy: '24.5%', tvl: '$2.4M', fee: '0.3%', currentPrice: 1.2460, priceChange24h: '+1.2%', volume24h: '$1.2M', high24h: '$1.2485', low24h: '$1.2320' },
    { pair: 'BTC/USDT', apy: '18.2%', tvl: '$1.8M', fee: '0.3%', currentPrice: 67420, priceChange24h: '+0.8%', volume24h: '$890K', high24h: '$67850', low24h: '$66900' },
    { pair: 'ETH/BTC', apy: '15.7%', tvl: '$950K', fee: '0.5%', currentPrice: 0.0368, priceChange24h: '-0.3%', volume24h: '$520K', high24h: '$0.0371', low24h: '$0.0365' },
    { pair: 'USDC/USDT', apy: '8.1%', tvl: '$3.2M', fee: '0.05%', currentPrice: 1.0001, priceChange24h: '+0.01%', volume24h: '$2.1M', high24h: '$1.0003', low24h: '$0.9998' },
    { pair: 'LINK/ETH', apy: '32.4%', tvl: '$680K', fee: '0.3%', currentPrice: 0.0041, priceChange24h: '+2.7%', volume24h: '$340K', high24h: '$0.0043', low24h: '$0.0040' },
  ];

  // Portfolio data
  const portfolioData = {
    totalValue: '$24,850',
    totalPnL: '+$2,145',
    activePositions: 7,
    averageAPY: '21.3%',
    performance: {
      return7d: '+5.2%',
      return30d: '+18.7%',
      maxDrawdown: '-3.1%',
      winRate: '73%'
    }
  };

  const positions = [
    { pair: 'ETH/USDC', amount: '$8,450', pnl: '+$745', apy: '24.5%', entryDate: '2024-08-15' },
    { pair: 'BTC/USDT', amount: '$6,200', pnl: '+$420', apy: '18.2%', entryDate: '2024-08-20' },
    { pair: 'LINK/ETH', amount: '$4,150', pnl: '+$680', apy: '32.4%', entryDate: '2024-08-25' },
    { pair: 'ETH/BTC', amount: '$3,850', pnl: '+$215', apy: '15.7%', entryDate: '2024-09-01' },
    { pair: 'USDC/USDT', amount: '$2,200', pnl: '+$85', apy: '8.1%', entryDate: '2024-09-05' },
    { pair: 'SOL/USDC', amount: '$1,850', pnl: '-$125', apy: '28.9%', entryDate: '2024-09-10' },
    { pair: 'AVAX/ETH', amount: '$1,350', pnl: '+$180', apy: '19.8%', entryDate: '2024-09-12' }
  ];

  // News feed data
  const newsItems = [
    { id: 1, type: 'news', title: 'Ethereum Layer 2 Volume Surges 40%', description: 'L2 protocols see record adoption as fees remain low', time: '2 hours ago', impact: 'bullish' },
    { id: 2, type: 'event', title: 'Federal Reserve Meeting', description: 'FOMC decision on interest rates expected', date: 'Tomorrow 2:00 PM', time: 'Sep 22', impact: 'neutral' },
    { id: 3, type: 'news', title: 'Major DeFi Protocol Launches v3', description: 'New concentrated liquidity features promise higher yields', time: '4 hours ago', impact: 'bullish' },
    { id: 4, type: 'news', title: 'Regulatory Clarity Improves for Crypto', description: 'New guidelines provide clearer framework for DeFi', time: '6 hours ago', impact: 'bullish' },
    { id: 5, type: 'event', title: 'Ethereum Core Dev Meeting', description: 'Discussion on upcoming network upgrades', date: 'Sep 24', time: '1 day', impact: 'neutral' },
    { id: 6, type: 'news', title: 'Whale Movement Detected', description: 'Large BTC transfer to exchange sparks selling pressure', time: '8 hours ago', impact: 'bearish' }
  ];

  // Get current pool data
  const currentPool = pools.find(p => p.pair === selectedPool) || pools[0];

  // Sample chart data - varies by pool
  const getChartData = () => {
    const basePrice = currentPool.currentPrice;
    const variation = basePrice * 0.02; // 2% variation

    return [
      { time: '00:00', price: basePrice - variation * 0.8, volume: 45000 },
      { time: '04:00', price: basePrice - variation * 0.5, volume: 52000 },
      { time: '08:00', price: basePrice - variation * 0.2, volume: 48000 },
      { time: '12:00', price: basePrice + variation * 0.1, volume: 67000 },
      { time: '16:00', price: basePrice + variation * 0.4, volume: 58000 },
      { time: '20:00', price: basePrice + variation * 0.7, volume: 71000 },
      { time: '24:00', price: basePrice, volume: 63000 },
    ];
  };

  const chartData = getChartData();

  // Debug chart data
  console.log('Chart data:', chartData);
  console.log('Current pool:', currentPool);

  // Generate random stars for background
  useEffect(() => {
    const generateStars = () => {
      const starArray = [];
      for (let i = 0; i < 25; i++) {
        starArray.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.6 + 0.3,
          delay: Math.random() * 3
        });
      }
      setStars(starArray);
    };
    generateStars();
  }, []);

  return (
    <div className="w-screen min-h-screen grid place-items-center">
      <div className="grid grid-cols-12 gap-1 max-w-7xl w-full h-[600px]">
        {/* <div className="col-span-1"></div> */}
        <Stats
          selectedPool={selectedPool}
          currentPool={currentPool}
          chartData={chartData} />
        <ActionPanel
          selectedPool={selectedPool}
          onSelectedPoolChange={setSelectedPool}
          pools={pools}
          portfolioData={portfolioData}
          positions={positions}
          newsItems={newsItems}
        />
        {/* <div className="col-span-1"></div> */}
      </div>
    </div>
  );
};

export default SpaceLiquidityPool;
