# Laniakea - Your Unified DeFi Dashboard

**Stop juggling tabs. Start making smarter decisions.**

Laniakea is the unified interface for Solana DeFi that brings together all your positions, protocols, and insights in one powerful dashboard. No more switching between apps, no more scattered data, no more missed opportunities.

## 🚀 What Makes Laniakea Different?

DeFi is complex enough — your interface shouldn't be. Laniakea solves the three biggest problems facing DeFi users today:

1. **Fragmented Experience** - Jumping between Drift for perps, Meteora for LPs, and different protocols for everything else
2. **Lost Context** - Forgetting why you bought, missing news that moved the market, and not seeing how your positions interact
3. **Information Overload** - Ten tabs open, constant context switching, and decision fatigue

## 🎯 The Solution: Three Core Modules

### 1. **Actions** - Execute Smarter
One interface for all protocols. Swap, stake, LP, and borrow without the complexity.

### 2. **Profile** - See Everything  
Your complete DeFi journey. Every token, position, and trade across all protocols in one view.

### 3. **Feed** - Never Miss What Matters
The market moves fast, but your memory doesn't have to. Pin news, tweets, and events directly to price charts.

## 🌟 Live Today

**Currently Available:**
- **Meteora Integration** - Manage liquidity pools with enhanced analytics
- **Drift Perpetuals** - Advanced trading with liquidation markers and TP/SL orders
- **Cross-Protocol Portfolio** - See all your positions in one dashboard
- **Market Feed** - Real-time news and events with chart annotations

**Launch Dashboard:** [https://app.laniakea.fun](https://app.laniakea.fun)  
**Landing Page:** [https://www.laniakea.fun](https://www.laniakea.fun)

## 🔮 Where We're Going

### **Phase 1: Enhanced Intelligence** (Next 2-3 months)
- Take-profit/stop-loss orders directly on charts
- Candle hover intelligence (see top buyers/sellers)
- Impermanent loss calculator with scenarios
- Auto-rebalance suggestions for LP positions

### **Phase 2: Cross-Protocol Intelligence** (3-6 months)  
- Jupiter integration with cross-protocol context
- Marginfi lending positions + borrow capacity alerts
- Arbitrage detection across protocols
- Combined risk analysis across all positions

### **Phase 3: Intelligent Execution** (6-12 months)
- One-click delta-neutral strategies
- ML-powered smart alerts for your risk profile
- Portfolio simulation ("What if SOL drops 20%?")
- Social trading and auto-optimization

## 💪 Built For Real DeFi Users

Laniakea is designed for the sophisticated DeFi user who:

- Uses multiple protocols daily
- Has positions across different platforms  
- Wants to understand portfolio risk, not just PnL
- Needs to react quickly to market events
- Tired of the "tab-juggling" lifestyle

## 🛠 Tech Stack

- **React 19 + TypeScript** - Modern, type-safe development
- **Solana Web3.js** - Native blockchain integration
- **Protocol SDKs** - Direct integration with Drift, Meteora, and more
- **Zustand State Management** - Clean, reactive state handling
- **Tailwind CSS + Radix UI** - Beautiful, accessible components
- **Real-time Data** - WebSocket feeds and live market updates

## 🚀 Getting Started

### For Users

1. **Visit** [app.laniakea.fun](https://app.laniakea.fun)
2. **Connect** your Solana wallet
3. **See** all your positions across protocols instantly
4. **Start** making smarter, faster decisions

### For Developers

Clone the repository, install dependencies, and start contributing to the future of DeFi interfaces:

```bash
git clone https://github.com/your-org/laniakea.git
cd laniakea
npm install
npm run dev
```

## 🤝 Join the Community

- **Follow us on X:** [@laniakeadapp](https://x.com/laniakeadapp)
- **Contributors Welcome** - We're building in public
- **Feedback Driven** - Your DeFi pain points shape our roadmap

---

*Laniakea: The DeFi interface for the rest of us.*

## Environment Configuration

Copy `.env.example` to `.env` and configure the following environment variables:

### Required Configuration

**Solana RPC Endpoints**:
- `VITE_SOLANA_RPC_ENDPOINT` - Main Solana RPC URL for general operations (Helius, QuickNode, or Alchemy)
- `VITE_DRIFT_RPC_ENDPOINT` - Drift-specific RPC endpoint (can be different from main RPC)
- `VITE_DRIFT_ENV` - Drift protocol network: `"devnet"` or `"mainnet-beta"`
- `VITE_SOLANA_CLUSTER` - Solana cluster for Sanctum: `"devnet"` or `"mainnet-beta"`

**Supabase (Feed Module)**:
- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://yourproject.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key for client-side access

**API Keys**:
- `VITE_SANCTUM_API_KEY` - Sanctum Gateway API key from [sanctum.so](https://sanctum.so)
- `VITE_SANCTUM_PROXY_URL` - Optional custom Sanctum proxy URL (leave empty for default)
- `VITE_VYBE_API_KEY` - Vybe Network API key from [vybenetwork.xyz](https://vybenetwork.xyz) for Profile module

The project uses [`dotenv`](https://www.npmjs.com/package/dotenv) for loading environment variables during builds and development.

## Technology Stack

### Core Framework
- **React 19.1** - UI framework with latest concurrent features
- **TypeScript 5.8** - Type-safe development with strict configuration
- **Vite 7.1** - Fast build tool with ESM-first approach and HMR

### Blockchain & Web3
- **Solana Web3.js 1.98** - Solana blockchain interaction
- **Solana Wallet Adapter** - Multi-wallet connectivity (@solana/wallet-adapter-react, wallet-adapter-wallets)
- **Drift SDK 2.142** - Perpetuals trading protocol integration (@drift-labs/sdk)
- **Meteora DLMM SDK 1.7** - Dynamic liquidity market maker (@meteora-ag/dlmm)
- **Saros DLMM SDK 1.4** - Liquidity pool integration (@saros-finance/dlmm-sdk)

### State Management & Data
- **Zustand 5.0** - Lightweight state management with stores per module
- **Supabase Client 2.76** - Backend as a service for Feed module (@supabase/supabase-js)
- **TanStack Query** - Server state management (via hooks in modules)

### Styling & UI
- **Tailwind CSS 4.1** - Utility-first CSS framework with custom theme
- **Radix UI** - Headless UI components (@radix-ui/react-*)
  - Dropdown Menu, Select, Slot, Tabs
- **shadcn/ui patterns** - Component patterns with components.json
- **Tailwind Animate** - Animation utilities
- **CSS Variables** - Theme customization (colors, radii, spacing)

### Charting & Visualization
- **Lightweight Charts 5.0** - TradingView-style candlestick charts (Drift module)
- **Recharts 3.2** - React-based charts for analytics (Meteora/Profile modules)

### Build & Development
- **Vite Plugin Node Polyfills** - Browser polyfills for Node.js modules (Buffer, process, stream, crypto, events)
- **ESLint 9** - Code linting with TypeScript support
- **PostCSS** - CSS processing with Tailwind

### Polyfills & Compatibility
The project includes extensive polyfills for Solana SDK compatibility:
- **Buffer** - Binary data handling
- **process** - Node.js process object shimming
- **stream** - Node.js stream API (custom Writable implementation)
- **events** - EventEmitter polyfill
- **crypto** - Cryptographic operations
- **RPC WebSocket shims** - Custom WebSocket client for Drift SDK

## Development Setup

### Prerequisites
- Node.js 18+ (v18.19.0 or higher recommended)
- npm or yarn package manager
- Solana CLI (optional, for advanced blockchain interactions)

### Installation
Clone the repository, install dependencies with `npm install`, copy `.env.example` to `.env`, and configure your API keys and RPC endpoints.

### Available Scripts
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - Type check

### Development Server
The dev server runs on `http://localhost:5173` by default with:
- Hot Module Replacement (HMR)
- Fast refresh for React components
- Source maps for debugging
- Auto-reload on file changes

## Build & Deployment

### Production Build
Run `npm run build` to create an optimized production build in the `dist/` directory with:
- Minified JavaScript and CSS
- Tree-shaking to remove unused code
- Code splitting for optimal loading
- Asset optimization and hashing

### Build Configuration
- **Output**: `dist/` directory
- **Target**: Modern browsers (ES2020+)
- **Polyfills**: Included for Solana SDK compatibility
- **Chunks**: Automatic code splitting by Rollup

### Deployment
The application is deployed at: https://www.laniakea.fun

Compatible with:
- Vercel (recommended)
- Netlify
- Static hosting (Cloudflare Pages, AWS S3 + CloudFront)
- IPFS/Arweave for decentralized hosting

# Laniakea DApp Integration Architecture

## Overview
Every dapp integrated into Laniakea follows a standardized three-module structure that ensures consistent user experience while maintaining flexibility for different protocol types.

## The Three Core Modules

### 1. Actions
Interactive elements that allow users to execute protocol-specific operations.

**Purpose**: All user-initiated transactions and interactions with the protocol  
**Location**: Primary action panel in the interface  
**Examples**:
- Create new positions/pools
- Add/deposit funds
- Remove/withdraw funds
- Claim rewards/fees
- Execute swaps/trades
- Search/discover opportunities

### 2. Profile  
User's current state and historical data within the protocol.

**Purpose**: Portfolio tracking, performance monitoring, and historical analysis  
**Location**: User dashboard/profile section  
**Components**:
- **Current Positions**: Active stakes, pools, loans, trades
- **Balances**: Available funds, locked funds, rewards pending
- **Performance Metrics**: Total Value Locked (TVL), PnL, APY/returns
- **Transaction History**: Past actions, timestamps, amounts
- **Analytics**: Position performance over time, yield tracking

### 3. Feed
Real-time information and notifications relevant to user's positions and market conditions.

**Purpose**: Keep users informed and alert them to important changes  
**Location**: Notification panel/activity feed  
**Content Types**:
- **Market Updates**: General crypto market news and trends  
- **Protocol News**: Updates from the specific dapp/protocol
- **Performance Notifications**: Significant PnL changes, milestone alerts

**Features**:
- **Timeline View**: Events organized chronologically with a "NOW" marker
- **Chart Annotations**: Save feed events as markers on price charts
- **Asset Filtering**: View events for specific assets (BTC, SOL, ETH, etc.)
- **Wallet Integration**: Personal annotation system tied to connected wallet
- **Cross-Chart Sync**: Annotations visible across all relevant asset charts

## Implementation Benefits

- **Consistency**: Users learn one interface pattern that works across all protocols
- **Modularity**: Each module can be developed and updated independently  
- **Scalability**: New protocols can be onboarded quickly using this framework
- **User Experience**: Familiar navigation reduces cognitive load when switching between protocols

## Integration Checklist
When adding a new dapp:
- [ ] Map all possible user actions to the Actions module
- [ ] Identify all user data points for the Profile module  
- [ ] Define relevant notifications and feeds for the Feed module
- [ ] Ensure consistent styling and interaction patterns

## Module Folder Structures

Each protocol integration follows a consistent modular structure with self-contained components, services, state, and types.

### Drift Module (Perpetuals Trading)

```
src/modules/drift/
├── components/
│   ├── charts/                    # Chart-specific components
│   ├── DriftAction.tsx            # Main action container
│   ├── DriftCandlestickChart.tsx  # TradingView-style chart
│   ├── DriftDepositModal.tsx      # Deposit/withdrawal UI
│   ├── DriftMarketDiscovery.tsx   # Market discovery interface
│   ├── DriftOrders.tsx            # Order management
│   ├── DriftOverview.tsx          # Dashboard overview
│   ├── DriftPositions.tsx         # Position tracking
│   ├── DriftStats.tsx             # Protocol statistics
│   ├── DriftTrade.tsx             # Trading interface
│   └── index.ts
├── hooks/
│   ├── useDriftMarketChart.ts     # Market chart data
│   ├── useDriftMarketDiscovery.ts # Market discovery logic
│   └── useDriftPositions.ts       # Position management
├── lib/
│   └── driftWalletAdapter.ts      # Wallet integration adapter
├── services/
│   ├── dlobWebsocketService.ts    # Decentralized orderbook WebSocket
│   ├── driftClientService.ts      # Drift SDK client
│   ├── driftPositionService.ts    # Position CRUD operations
│   ├── historicalDataService.ts   # Historical price data
│   └── marketDiscoveryService.ts  # Market data aggregation
├── shims/
│   ├── rpcWebsocketClient.ts      # Custom WebSocket client
│   └── rpcWebsocketFactory.ts     # WebSocket factory (Vite compatibility)
├── state/
│   ├── driftMarketStore.ts        # Market data state
│   ├── driftPositionsStore.ts     # User positions state
│   ├── driftSessionStore.ts       # Session/connection state
│   ├── driftStore.ts              # Main Drift state
│   └── index.ts
├── types/
│   ├── index.ts
│   └── market.ts                  # Market-related types
└── utils/                         # Utility functions
```

### Meteora Module (DLMM Liquidity Pools)

```
src/modules/meteora/
├── components/
│   ├── manage/
│   │   ├── AddLiquidityForm.tsx
│   │   ├── ManageHeader.tsx
│   │   └── RemoveLiquidityPanel.tsx
│   ├── profile/
│   │   ├── PoolPositionCard.tsx
│   │   └── PositionRow.tsx
│   ├── MeteoraAction.tsx          # Main action container
│   ├── MeteoraBinChart.tsx        # Bin distribution chart
│   ├── MeteoraDiscover.tsx        # Pool discovery
│   ├── MeteoraFeeChart.tsx        # Fee analytics chart
│   ├── MeteoraManage.tsx          # Pool management
│   ├── MeteoraPairGroupsHeatmap.tsx # Heatmap visualization
│   ├── MeteoraPositionOverview.tsx  # Position summary
│   ├── MeteoraProfile.tsx         # User profile
│   ├── MeteoraStats.tsx           # Protocol stats
│   └── MeteoraVolumeChart.tsx     # Volume analytics
├── constants.ts                    # Protocol constants
├── hooks/
│   ├── useActiveBin.ts
│   ├── useAutoDismissMessages.ts
│   ├── useBinCalculations.ts
│   ├── useFetchBinDistribution.ts
│   ├── useMeteoraPoolAnalytics.ts
│   ├── useMeteoraPoolMetadata.ts
│   ├── useMeteoraProtocolMetrics.ts
│   └── useWalletBalances.ts
├── lib/
│   └── meteoraConnection.ts       # Meteora SDK connection
├── services/
│   ├── analytics.ts               # Analytics data fetching
│   ├── api.ts                     # API client
│   ├── bins.ts                    # Bin distribution logic
│   ├── dlmmClient.ts              # DLMM SDK client
│   ├── liquidity.ts               # Liquidity operations
│   ├── positions.ts               # Position management
│   └── profile.ts                 # User profile data
├── state/
│   ├── index.ts
│   ├── meteoraDataStore.ts        # Protocol data cache
│   └── meteoraStore.ts            # Main Meteora state
├── types/
│   └── domain.ts                  # Domain models
└── utils/
    ├── balanceFormatters.ts
    ├── logger.ts
    ├── polling.ts
    ├── positionTransform.ts
    └── tokenConversion.ts
```

### Saros Module (DLMM Liquidity Pools - Legacy)

```
src/modules/saros/
├── components/
│   ├── create/
│   │   ├── CreateExistingPoolsNotice.tsx
│   │   ├── CreateFeeTierSelector.tsx
│   │   ├── CreatePriceInput.tsx
│   │   ├── CreateStatusMessages.tsx
│   │   └── CreateTokenPairSection.tsx
│   ├── manage/
│   │   ├── AddLiquidityForm.tsx
│   │   ├── ManageHeader.tsx
│   │   └── RemoveLiquidityPanel.tsx
│   ├── BinChart.tsx
│   ├── SarosAction.tsx
│   ├── SarosCreatePool.tsx
│   ├── SarosDiscover.tsx
│   ├── SarosManage.tsx
│   └── TokenSelector.tsx
├── hooks/
│   ├── queryKeys.ts
│   ├── useFetchBinDistribution.ts
│   ├── useFetchOverviewChart.ts
│   └── useFetchPoolMetadata.ts
├── lib/
│   └── liquidityBook.ts
├── services/
│   ├── liquidity.ts
│   ├── pools.ts
│   ├── positions.ts
│   ├── sdkClient.ts
│   ├── shared.ts
│   ├── tokenService.ts
│   └── poolService.ts (legacy re-exports)
├── state/
│   ├── index.ts
│   ├── sarosDataStore.ts
│   └── sarosStore.ts
├── types/
│   ├── domain.ts
│   └── sdk.ts
└── utils/
    ├── index.ts
    ├── logger.ts
    ├── math.ts
    └── price.ts
```

### Profile Module (Cross-Protocol Portfolio)

```
src/modules/profile/
├── components/
│   └── ProfilePanel.tsx           # Main profile dashboard
├── index.ts
├── services/
│   └── profileService.ts          # Portfolio aggregation via Vybe API
├── state/
│   └── profileStore.ts            # Profile state management
└── types/
    └── index.ts                   # Profile-related types
```

All module-specific code lives within `src/modules/{protocol}/...` to maintain clean separation and allow independent development without polluting the global namespace.

### Feed Module (Market News & Annotations)

```
src/modules/feed/
├── components/
│   ├── FeedCard.tsx              # Individual feed item card
│   ├── FeedPanel.tsx             # Main feed container with timeline
│   └── index.ts
├── services/
│   ├── annotationService.ts      # Chart annotation CRUD operations
│   └── feedService.ts            # Feed item data fetching
├── state/
│   ├── annotationStore.ts        # Zustand store for annotations
│   └── feedStore.ts              # Zustand store for feed items
└── types/
    └── feedTypes.ts              # TypeScript interfaces
```

**Database Schema (Supabase)**:
- `feed_items`: Market events, news, protocol updates
- `chart_annotations`: User-saved annotations linked to feed events

**Key Features**:
- Wallet-based annotation system (max 10 per asset)
- Asset-specific chart markers with tooltips
- Timeline view with chronological events
- Optimized queries (single getAllUserAnnotations call)
- Race condition protection with loading refs
- Graceful error handling and empty states
- Cross-chart synchronization of annotations

## Module Architecture & Patterns

### Common Module Structure

All protocol modules follow a consistent architecture pattern with folders for: components (UI layer), hooks (logic reuse), services (API/SDK interactions), state (Zustand stores), types (TypeScript interfaces), utils (helper functions), and lib (SDK clients and adapters).

### State Management Pattern

Each module uses **Zustand** for state management with separate stores:

**Data Store Pattern** (e.g., `meteoraDataStore.ts`, `sarosDataStore.ts`):
- Protocol data cache (pools, markets, analytics)
- Handles loading, error states
- Provides data fetching operations

**UI Store Pattern** (e.g., `meteoraStore.ts`, `driftStore.ts`):
- UI state and user interactions
- Selected pools, active tabs, UI toggles
- Setter methods for state updates

**Benefits**:
- Separation of concerns (data vs UI state)
- Easy to test and maintain
- Minimal re-renders with selective subscriptions
- No prop drilling needed

### Service Layer Pattern

Services encapsulate SDK and API interactions with async functions for fetching user data, managing positions, and executing protocol operations.

**Key Principles**:
- One service file per domain (positions, liquidity, analytics)
- Services are stateless
- Error handling at service layer
- Return domain types, not SDK types

### Component Integration Pattern

Each module exports a main action component (e.g., `MeteoraAction`, `DriftAction`) that uses Radix UI Tabs for Manage/Discover/Profile views. The `ActionPanel` in `App.tsx` conditionally renders the active protocol's action component based on user selection.

### Hook Composition Pattern

Custom hooks encapsulate reusable logic like fetching pool metadata, managing loading states, and handling side effects with useEffect.

**Best Practices**:
- Prefix with `use` (React convention)
- Return objects for clarity
- Handle loading and error states
- Clean up subscriptions in useEffect

### Cross-Module Communication

Modules remain independent but can share data through:

1. **Global Wallet State** - Shared wallet adapter context
2. **Feed Annotations** - Cross-module chart annotations via Feed store
3. **Profile Aggregation** - Profile module aggregates data from all protocols
4. **Shared Components** - Common UI components in `src/components/`

**Example**: Feed annotations appear on Drift candlestick charts and Meteora volume charts by accessing the annotation store and filtering by asset.

## API & External Service Integrations

### Solana RPC Endpoints

**Main RPC** (`VITE_SOLANA_RPC_ENDPOINT`):
- Used by: Meteora, Saros, Profile modules
- Purpose: General blockchain queries, transaction submission
- Providers: Helius, QuickNode, Alchemy, or self-hosted
- Rate Limits: Varies by provider (typically 10-100 req/s)

**Drift RPC** (`VITE_DRIFT_RPC_ENDPOINT`):
- Used by: Drift module exclusively
- Purpose: High-frequency price updates, orderbook streaming
- Can be separate endpoint with higher rate limits
- Supports WebSocket connections for real-time data

**Best Practices**:
- Use different endpoints for different modules to distribute load
- Monitor rate limits to avoid throttling
- Consider backup endpoints for failover
- Use connection pooling for efficiency

### Supabase (Feed Module)

**Configuration**:
- `VITE_SUPABASE_URL` - Project URL
- `VITE_SUPABASE_ANON_KEY` - Public anonymous key (safe for client-side)

**Database Tables**:

1. **`feed_items`** - Market events and news with fields: id (uuid), title, description, timestamp, type (news/event/protocol_update), asset, impact (bullish/bearish/neutral), source_url

2. **`chart_annotations`** - User-saved chart markers with fields: id (uuid), wallet_address (indexed), asset, feed_item_id (FK), timestamp, created_at

**Row Level Security (RLS)**:
- Annotations: Users can only read/write their own (wallet_address filter)
- Feed items: Public read access, admin write access

**Client Usage**: Initialize with `createClient()` from `@supabase/supabase-js` using the environment variables.

### Vybe Network API (Profile Module)

**Configuration**:
- `VITE_VYBE_API_KEY` - API key from vybenetwork.xyz

**Purpose**: Cross-protocol portfolio aggregation
- Fetches positions from multiple DeFi protocols
- Aggregates TVL, PnL, and performance metrics
- Historical data for portfolio analytics

**Endpoints Used**:
- `/v1/portfolio/{walletAddress}` - Aggregate portfolio data
- `/v1/positions/{walletAddress}` - Detailed position breakdown
- `/v1/analytics/{walletAddress}` - Performance metrics

**Rate Limits**:
- Free tier: 100 requests/hour
- Pro tier: 1000 requests/hour

**Example Request**: Use fetch with Bearer token authentication and the wallet address in the URL path.

### Sanctum Gateway API (Token Metadata)

**Configuration**:
- `VITE_SANCTUM_API_KEY` - API key from sanctum.so
- `VITE_SANCTUM_PROXY_URL` - Optional custom proxy

**Purpose**: LST (Liquid Staking Token) metadata and routing
- Token prices and metadata
- LST-specific analytics
- Sanctum swap routing

**Usage**:
- Token selection in swap interfaces
- Price feeds for LST tokens
- Sanctum-specific pool discovery

### Protocol SDKs

**Drift SDK** (`@drift-labs/sdk`):
- Initialize `DriftClient` with connection, wallet adapter, and environment (devnet/mainnet-beta)
- Provides methods for trading, position management, and market data

**Meteora DLMM SDK** (`@meteora-ag/dlmm`):
- Create DLMM instance with connection and pool address
- Methods for fetching positions, adding/removing liquidity, and pool analytics

**Saros DLMM SDK** (`@saros-finance/dlmm-sdk`):
- Similar API to Meteora for DLMM operations
- Create instance with connection and pool address

## Configuration Files

### vite.config.ts

**Key Configurations**:

1. **Node.js Polyfills**:
   - Includes Buffer, process, stream, util, crypto, events
   - Required for Solana SDK browser compatibility
   - Custom stream polyfill for ripemd160 (used by crypto libraries)

2. **Path Aliases**:
   - `@/*` → `/src/*` for clean imports
   - Custom shims for Drift WebSocket client (Vite compatibility)
   - js-sha256 and process polyfills

3. **Global Definitions**: Maps `global` to `globalThis`, defines empty `process.env` object, sets process version and browser flag for compatibility

4. **Build Options**:
   - CommonJS to ESM transformation
   - No manual chunks (automatic code splitting)
   - ES2020+ target for modern browsers

### tailwind.config.js

**Custom Theme Extensions**:

1. **CSS Variables**:
   - `--background`, `--foreground`, `--primary`, etc.
   - Allows runtime theme switching
   - Compatible with shadcn/ui component library

2. **Custom Font**:
   - `Itim` font family for decorative text
   - Loaded via Google Fonts in index.html

3. **Chart Colors**:
   - `chart-1` through `chart-5` for consistent data visualization
   - `candle-up` and `candle-down` for trading charts

4. **Border Radius**:
   - CSS variable-based (`--radius-lg`, `--radius-md`, `--radius-sm`)
   - Consistent across all components

5. **Plugins**:
   - `tailwindcss-animate` for built-in animations

### tsconfig.json Hierarchy

**Root tsconfig.json**:
- References two separate configs: `tsconfig.app.json` and `tsconfig.node.json`
- Defines base path aliases: `@/*` → `./src/*`

**tsconfig.app.json** (Application Code):
- Target: ES2020
- Lib: ES2020, DOM, DOM.Iterable
- Module: ESNext
- Strict type checking enabled
- JSX: react-jsx (React 17+ transform)
- Includes: `src/**/*`

**tsconfig.node.json** (Build Scripts):
- Target: ES2022
- Lib: ES2023
- Module: ESNext
- Includes: `vite.config.ts`, `*.config.js`

**Why Separate Configs?**:
- Different environments (browser vs Node.js)
- Different module resolution rules
- Build scripts don't need DOM types

### ESLint Configuration

**eslint.config.js**:
- ESLint 9 flat config format
- TypeScript ESLint parser and rules
- React Hooks plugin for hook linting
- React Refresh plugin for HMR compatibility

**Key Rules**:
- Enforces React hooks rules
- Warns on unused variables
- Validates JSX and TypeScript patterns

## Project Structure

```
laniakea/
├── src/
│   ├── components/          # Shared UI components
│   ├── hooks/               # Shared custom hooks
│   ├── lib/                 # Shared utilities (cn, utils)
│   ├── modules/             # Protocol-specific modules
│   │   ├── drift/
│   │   ├── meteora/
│   │   ├── saros/
│   │   ├── feed/
│   │   └── profile/
│   ├── polyfills/           # Browser polyfills for Node.js APIs
│   ├── store/               # Global Zustand stores
│   ├── types/               # Global TypeScript types
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + CSS variables
├── public/                  # Static assets
├── dist/                    # Build output (gitignored)
├── components.json          # shadcn/ui configuration
├── .env.example             # Environment template
├── .env                     # Local environment (gitignored)
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript base config
├── tsconfig.app.json        # App TypeScript config
├── tsconfig.node.json       # Build scripts TypeScript config
├── eslint.config.js         # ESLint configuration
├── postcss.config.js        # PostCSS configuration
└── package.json             # Dependencies and scripts
```