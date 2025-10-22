# Laniakea - The Dapp Constellation

Solana DeFi is exploding with innovation. Meteora for liquidity pools, Drift for perps, Jupiter for swaps, Marginfi for lending. But users are stuck juggling dozens of different interfaces, each with unique UX patterns, scattered data, and no unified view of their positions.

We believe now is the right time to build the Bloomberg Terminal for Solana DeFi. The protocol ecosystem is mature enough. The data infrastructure is ready. And users are drowning in interface complexity.

Live deployment: https://www.laniakea.fun

The key insight: DeFi users don't want more apps - they want better intelligence and unified execution. Imagine seeing all your positions across protocols in one dashboard, getting smart alerts when your Meteora LP goes out of range while you're levered long on Drift, or executing delta-neutral strategies with one-click cross-protocol actions.

Current solutions are either pure aggregators (no insights) or pure analytics (no actions). Laniakea combines both with a modular architecture: Actions, Profile, and Feed components that work consistently across any protocol.

The wedge is sophisticated DeFi users who are already using multiple protocols. Start with Meteora + Drift integration, expand to the full Solana DeFi stack, then become the operating system for multichain DeFi strategies.

## Environment Configuration

Copy `.env.example` to `.env` and set `VITE_SOLANA_RPC_ENDPOINT` to your preferred Solana RPC URL. A sample Helius endpoint is provided. The project relies on the [`dotenv`](https://www.npmjs.com/package/dotenv) package (already listed in `package.json`) for loading these variables during builds and local development.

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

## Saros Module Folder Structure

```
src/modules/saros/
├── components/
│   ├── BinChart.tsx
│   ├── SarosAction.tsx
│   ├── SarosActionRail.tsx
│   ├── SarosCreatePool.tsx
│   ├── SarosDiscover.tsx
│   ├── SarosManage.tsx
│   ├── TokenSelector.tsx
│   ├── create/
│   │   ├── CreateExistingPoolsNotice.tsx
│   │   ├── CreateFeeTierSelector.tsx
│   │   ├── CreatePriceInput.tsx
│   │   ├── CreateStatusMessages.tsx
│   │   └── CreateTokenPairSection.tsx
│   └── manage/
│       ├── AddLiquidityForm.tsx
│       ├── ManageHeader.tsx
│       └── RemoveLiquidityPanel.tsx
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

All Saros-specific hooks, services, and state live within `src/modules/saros/...` so additional dapps can plug in their own module-local implementations without polluting the global `src/` namespace.

## Feed Module Folder Structure

```
src/modules/feed/
├── components/
│   ├── FeedCard.tsx              # Individual feed item card
│   ├── FeedPanel.tsx             # Main feed container with timeline
│   └── FeedSettings.tsx          # Feed preferences and filters
├── services/
│   ├── annotationService.ts      # Chart annotation CRUD operations
│   └── feedService.ts            # Feed item data fetching
├── state/
│   ├── annotationStore.ts        # Zustand store for annotations
│   └── feedStore.ts              # Zustand store for feed items
├── types/
│   └── feedTypes.ts              # TypeScript interfaces
└── SECURITY.md                   # Security considerations and roadmap
```

**Database Schema (Supabase)**:
- `feed_items`: Market events, news, protocol updates
- `chart_annotations`: User-saved annotations linked to feed events

**Key Features**:
- Wallet-based annotation system (max 10 per asset)
- Asset-specific chart markers with tooltips
- Optimized queries (single getAllUserAnnotations call)
- Race condition protection with loading refs
- Graceful error handling and empty states