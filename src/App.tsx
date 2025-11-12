import { useState } from 'react';
import { ArrowRight, Twitter } from 'lucide-react';
import Stats from './components/Stats';
import ActionPanel from './components/ActionPanel';
import AdminPanel from './modules/feed/admin/AdminPanel';
import { WaitlistModal } from './components/WaitlistModal';



const APP_URL = import.meta.env.VITE_APP_URL ?? (import.meta.env.DEV ? 'http://localhost:5173/?surface=app' : 'https://app.laniakea.fun/');
const SOCIAL_URL = 'https://x.com/laniakeadapp';

const LandingPage = () => {
  return (
    <div className="relative w-screen overflow-x-hidden bg-background text-foreground">
      {/* Ambient Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/40 blur-[160px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-secondary/40 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between gap-6 px-6 py-8 md:px-16">
        <div className="flex items-center gap-4">
          <img
            src="/logov3.png"
            alt="Laniakea Logo"
            className="h-12 w-12 rounded-full"
          />
          <div className="text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Laniakea
          </div>
        </div>

        <a
          href={SOCIAL_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-5 py-2 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground transition hover:border-border hover:bg-card/60 hover:text-foreground"
        >
          X
          <span>Follow</span>
        </a>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:px-16 md:py-32">
        <div className="mx-auto max-w-5xl space-y-8 text-center">
          <h1 className="text-2xl leading-tight md:text-4xl">
            Every position. Every protocol. Every insight. One place.
            <br />
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            You’ve opened ten tabs, lost track of positions, forgotten why you bought, and missed the news that moved the market.
            <br /> Laniakea brings it all together — so you can finally breathe.
          </p>

          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center">
            <a
              href={APP_URL}
              className="inline-flex items-center justify-center gap-3 rounded-full 
              bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] 
              text-primary-foreground transition hover:bg-primary/20"
            >
              Launch App
              <ArrowRight className="h-5 w-5" />
            </a>
            <div className="text-sm text-muted-foreground">
              One dashboard. No more chaos.
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Modules */}
      <section className="relative px-6 py-20 md:px-16 md:py-55">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl mb-4">
              Everything you need. One place.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This isn’t about features. It’s about finally having everything in one place.
            </p>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-border/40 bg-card/30 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="text-2xl font-semibold uppercase tracking-[0.35em] text-secondary-foreground mb-4">
                    Actions
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Swap. Stake. LP. Borrow.
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>One interface. All protocols.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>No more copying addresses or checking gas.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Do what you meant to do — not what the UI lets you do.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-card/30 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="text-2xl font-semibold uppercase tracking-[0.35em] text-secondary-foreground mb-4">
                    Profile
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Not just balances. Your journey.
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>See every token, every position, every trade — across protocols</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>No more “Wait, did I LP here?</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Watch your progress, not just your PnL</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Understand how your actions connect over time.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-card/30 p-8 md:p-12">
              <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                <div>
                  <h3 className="text-2xl font-semibold uppercase tracking-[0.35em] 
                  text-secondary-foreground mb-4">
                    Feed
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {/* Your Memory. Your Edge.<br /> */}
                    <span>
                      The market moves fast. But your memory doesn’t have to
                    </span>
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Save tweets, news, events, and ideas — and pin them directly to price charts.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>See Trump’s tweet exactly where it crashed the market.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Remember why you bought SOL in May.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                    <span>Never forget what moved the needle — again.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="relative px-6 py-20 md:px-16 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl mb-4">
              Where We’re Going
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From clarity → confidence → foresight.
            </p>
            <p>Today: See everything in one place.</p>
            <p>Soon: Get alerts when your positions are at risk.</p>
            <p>Future: “Based on your history, this event matters.”
              (ML that learns you, not just the market)</p>
          </div>

          <div className="space-y-8">
            {/* Phase 1 */}
            <div className="rounded-3xl border-2 border-secondary-foreground/60 bg-card/50 p-8 md:p-12">
              <div className="flex items-start gap-6 mb-8">
                <div className="rounded-full bg-secondary-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.35em] text-secondary-foreground">
                  Phase 1
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Enhanced Intelligence</h3>
                  <p className="text-sm text-muted-foreground">Next 2-3 months</p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Perps Enhanced</h4>
                  <div className="space-y-3 text-sm text-secondary-foreground">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>TP/SL Orders:</strong> Set take-profit and stop-loss directly on charts</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Candle Hover Intelligence:</strong> See top 5 buyers/sellers for each candle</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Liquidation Markers:</strong> Visualize liquidation events on timeline</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Customized PnL:</strong> Include fees, funding, and slippage in calculations</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold ">LP Enhanced</h4>
                  <div className="space-y-3 text-sm text-secondary-foreground">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Auto-Rebalance Suggestions:</strong> Get alerts when bins need adjustment</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>IL Calculator:</strong> Real-time impermanent loss with scenarios</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Fee ROI Projections:</strong> Based on volume trends and historical data</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-1.5 w-1.5 rounded-full bg-secondary-foreground flex-shrink-0" />
                      <span><strong>Pool Comparison Matrix:</strong> Compare multiple pools side-by-side</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="rounded-3xl border border-border/40 bg-card/30 p-8 md:p-12">
              <div className="flex items-start gap-6 mb-8">
                <div className="rounded-full bg-muted px-4 py-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Phase 2
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Cross-Protocol Intelligence</h3>
                  <p className="text-sm text-muted-foreground">3-6 months</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 text-muted-foreground">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Jupiter Integration:</strong> Swap + limit orders with cross-protocol context</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Marginfi Integration:</strong> Lending positions + borrow capacity alerts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Arbitrage Detection:</strong> &quot;0.3% spread between Jupiter and Meteora&quot;</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Yield Comparison:</strong> &quot;Marginfi borrow rate &gt; Meteora LP yield&quot;</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Combined Risk Analysis:</strong> &quot;Liquidation risk across all positions: 8% SOL move&quot;</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Portfolio Correlation:</strong> See how positions hedge or amplify each other</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="rounded-3xl border border-border/40 bg-card/30 p-8 md:p-12">
              <div className="flex items-start gap-6 mb-8">
                <div className="rounded-full bg-muted px-4 py-2 text-xs uppercase tracking-[0.35em] text-muted-foreground">
                  Phase 3
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Intelligent Execution</h3>
                  <p className="text-sm text-muted-foreground">6-12 months</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 text-muted-foreground">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Strategy Builder:</strong> One-click delta-neutral, basis trading, funding arbitrage</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Smart Alerts:</strong> ML-powered notifications for your specific risk profile</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Portfolio Simulation:</strong> &quot;What if SOL drops 20%?&quot; across all positions</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Social Trading:</strong> Follow top performers&apos; cross-protocol strategies</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Auto-Optimization:</strong> Suggest rebalancing based on market conditions</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground flex-shrink-0" />
                    <span><strong>Predictive Analytics:</strong> Forecast position performance based on historical patterns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative px-6 py-20 md:px-16 md:py-32 bg-card/20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl mb-4">
              Real Life. Real Relief.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how Laniakea prevents losses and surfaces opportunities
            </p>
          </div>

          <div className="space-y-8">
            <div className="rounded-3xl border border-border/40 bg-background/50 p-8 md:p-12">
              <h3 className="text-xl mb-6">Scenario 1: The Missed Opportunity</h3>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-destructive">
                    Before Laniakea</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I left my LP running. I forgot. I lost fees.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary-foreground">With Laniakea</div>
                  <p className="text-sm leading-relaxed">
                    Get an alert. Fix it in one click. Keep earning.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-background/50 p-8 md:p-12">
              <h3 className="text-xl mb-6">Scenario 2: The News You Missed</h3>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-destructive">Before Laniakea</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    I saw the tweet 6 hours after it moved the market.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary-foreground">With Laniakea</div>
                  <p className="text-sm leading-relaxed">
                    Pin it to the chart. Next time, you’ll see it when it happens.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border/40 bg-background/50 p-8 md:p-12">
              <h3 className="text-xl mb-6">Scenario 3: The Wallet You Can’t Remember</h3>
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-destructive">Before Laniakea</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Do I have tokens here? Did I claim rewards?
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary-foreground">With Laniakea</div>
                  <p className="text-sm leading-relaxed">
                    One profile. No more guessing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="relative px-6 py-20 md:px-16 md:py-32">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-5xl">
            Why We Built This
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              We built Laniakea because we were lost too.
            </p>
            <p>
              When we started:

              We lost money because we didn’t understand. <br />
              We missed opportunities because we were distracted.<br />
              We forgot why we made decisions.<br />
              We felt like DeFi wasn’t built for people like us.<br />
            </p>
          </div>
          <div className="pt-8">
            <a
              href={APP_URL}
              className="inline-flex items-center justify-center gap-3 rounded-full 
              bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em]
               text-primary-foreground transition hover:bg-primary/30"
            >
              Try something new
              <ArrowRight className="h-5 w-5" />
            </a>
            {/* Laniakea: The DeFi interface for the rest of us. */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12 md:px-16 border-t border-border/40">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logov3.png"
                alt="Laniakea Logo"
                className="h-12 w-12 rounded-full"
              />
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.3em] text-foreground">
                  Laniakea
                </div>
                <div className="text-xs text-muted-foreground">
                  The DeFi Operating System
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href={APP_URL} className="text-muted-foreground hover:text-foreground transition">
                Launch App
              </a>
              <a href={SOCIAL_URL} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition">
                X
              </a>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-secondary-foreground animate-pulse" />
                <span>Live: Meteora + Drift</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const computeSurface = () => {
  if (typeof window === 'undefined') {
    return 'landing';
  }

  const { hostname, pathname, search } = window.location;
  const normalizedHost = hostname.toLowerCase();
  const params = new URLSearchParams(search);

  if (params.get('surface') === 'app') {
    return 'app';
  }

  if (params.get('surface') === 'admin') {
    return 'admin';
  }

  if (params.get('surface') === 'x402') {
    return 'x402';
  }

  if (params.get('surface') === 'landing') {
    return 'landing';
  }

  const hostSegments = normalizedHost.split('.');
  const hostIndicatesApp = hostSegments[0] === 'app';

  if (hostIndicatesApp || pathname.startsWith('/app')) {
    return 'app';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }

  if (pathname.startsWith('/x402')) {
    return 'x402';
  }

  return 'landing';
};

const SpaceLiquidityPool = () => {

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
          currentPool={currentPool}
          chartData={chartData}
        />
      </div>
    </div>
  );
};

import { X402DemoPage as X402Demo } from './modules/x402/components/demo/X402DemoPage';

const App = () => {
  const [surface] = useState(computeSurface);

  if (surface === 'admin') {
    return (
      <>
        <AdminPanel />
        <WaitlistModal />
      </>
    );
  }

  if (surface === 'x402') {
    return (
      <>
        <X402Demo />
        <WaitlistModal />
      </>
    );
  }

  return (
    <>
      {surface === 'app' ? <SpaceLiquidityPool /> : <LandingPage />}
      <WaitlistModal />
    </>
  );
};

export default App;
