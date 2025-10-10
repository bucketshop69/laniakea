import { useState, useEffect } from 'react';
import { ArrowRight, Twitter } from 'lucide-react';
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

const APP_URL = import.meta.env.VITE_APP_URL ?? (import.meta.env.DEV ? 'http://localhost:5173/?surface=app' : 'https://app.laniakea.fun/');
const SOCIAL_URL = 'https://x.com/bucketshop69';

const LandingPage = () => {
  const modules = [
    {
      title: 'Actions',
      description: 'Execute cross-protocol liquidity, leverage, and hedging strategies without context switching.'
    },
    {
      title: 'Profile',
      description: 'Track every position, balance, and performance metric across your Solana DeFi stack in real time.'
    },
    {
      title: 'Feed',
      description: 'Stay ahead with alerts, market intel, and protocol updates tuned to your active strategies.'
    }
  ];

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-cyan-500/20 blur-[140px]" />
      </div>

      <div className="relative flex flex-1 flex-col px-6 py-8 md:px-16 md:py-12">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-[0.35em]">
              LA
            </div>
            <div className="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
              Laniakea
            </div>
          </div>

          <a
            href={SOCIAL_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium uppercase tracking-[0.25em] text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
          >
            <Twitter className="h-4 w-4" />
            <span>Follow</span>
          </a>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Solana DeFi Command Center</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                  The Bloomberg Terminal for Solana DeFi
                </h1>
                <p className="max-w-xl text-base text-white/70 md:text-lg">
                  Laniakea unifies execution and intelligence so power users can manage LPs, perps, lending, and swaps in one place. No more juggling dashboards&mdash;run cross-protocol plays with clarity.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-flow-col sm:auto-cols-fr sm:items-center sm:gap-6">
                <a
                  href={APP_URL}
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-900 transition hover:bg-slate-200"
                >
                  Launch App
                  <ArrowRight className="h-4 w-4" />
                </a>

                <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-white/70">
                  <p className="text-white">Live integrations: Meteora & Drift</p>
                  <p>Next up: Jupiter, Marginfi, and cross-chain strategy bundles.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {modules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-3xl border border-white/15 bg-white/5 p-6 transition hover:border-white/40 hover:bg-white/10"
                >
                  <h2 className="text-base font-semibold uppercase tracking-[0.35em] text-white/80">
                    {module.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.3em] text-white/40">
          <div className="flex items-center gap-3">
            <span>Actions</span>
            <span className="h-px w-8 bg-white/20" />
            <span>Profile</span>
            <span className="h-px w-8 bg-white/20" />
            <span>Feed</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Strategy intelligence online</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const computeIsAppSurface = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const { hostname, pathname, search } = window.location;
  const normalizedHost = hostname.toLowerCase();
  const params = new URLSearchParams(search);

  if (params.get('surface') === 'app') {
    return true;
  }

  if (params.get('surface') === 'landing') {
    return false;
  }

  const hostSegments = normalizedHost.split('.');
  const hostIndicatesApp = hostSegments[0] === 'app';

  return hostIndicatesApp || pathname.startsWith('/app');
};

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
  console.log('Stars generated:', stars.length);

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
    <div className="w-screen h-screen overflow-hidden md:min-h-screen md:h-auto md:overflow-visible md:grid md:place-items-center">
      <div className="grid grid-cols-12 gap-1 max-w-7xl w-full h-full md:h-[600px]">
        <Stats
          selectedPool={selectedPool}
          currentPool={currentPool}
          chartData={chartData}
          className="hidden md:block" />
        <ActionPanel
          selectedPool={selectedPool}
          onSelectedPoolChange={setSelectedPool}
          pools={pools}
          portfolioData={portfolioData}
          positions={positions}
          newsItems={newsItems}
        />
      </div>
    </div>
  );
};

const App = () => {
  const [isAppSurface] = useState(computeIsAppSurface);

  return isAppSurface ? <SpaceLiquidityPool /> : <LandingPage />;
};

export { SpaceLiquidityPool };
export default App;
