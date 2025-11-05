# Laniakea - Unified DeFi Dashboard Project

## Project Overview

Laniakea is a sophisticated React-based DeFi dashboard application built for the Solana blockchain. It serves as a unified interface that consolidates multiple DeFi protocols (Meteora for liquidity pools, Drift for perpetuals, Jupiter for swaps, etc.) into a single, cohesive user experience. The application allows users to manage positions, execute trades, and track market insights across multiple protocols from one dashboard.

## Repository Structure

```
laniakea/
├── components.json              # Shadcn/ui component configuration
├── index.html                   # Main HTML entry point
├── package.json                 # Project dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.app.json           # TypeScript app configuration
├── tsconfig.json               # Main TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── .env.example                # Environment variables template
├── README.md                   # Project overview
├── docs/                       # Documentation files
├── src/
│   ├── assets/                 # Static assets
│   ├── components/             # Reusable React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── modules/                # Core feature modules (drift, meteora, feed, profile)
│   ├── polyfills/              # Browser polyfill implementations
│   ├── store/                  # Application state management
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                 # Main application component
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
```

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS + Radix UI + CSS Variables
- **Build Tool**: Vite
- **State Management**: Zustand
- **Blockchain Integration**: Solana Web3.js, Wallet Adapter
- **Charting**: Lightweight Charts
- **UI Components**: Radix UI primitives, custom components
- **Protocol SDKs**: Drift SDK, Meteora SDK, Saros SDK

## Key Modules

### 1. Drift Module
Integrates with the Drift perpetual protocol for advanced trading features:
- Position management
- Liquidation markers
- TP/SL order functionality
- Cross-protocol context

### 2. Meteora Module
Handles liquidity pool management:
- LP position tracking
- Impermanent loss calculations
- Fee ROI projections
- Pool comparisons

### 3. Feed Module
Market feed and news integration:
- Real-time news and events
- Chart annotations
- Cross-protocol market insights

### 4. Profile Module
User profile and portfolio management:
- Cross-protocol position tracking
- Historical trade data
- Performance analytics

## Environment Variables

The application requires various API keys for different services:

- `VITE_SOLANA_RPC_ENDPOINT`: Main Solana RPC endpoint
- `VITE_DRIFT_RPC_ENDPOINT`: Drift-specific RPC endpoint
- `VITE_DRIFT_ENV`: Drift environment (devnet/mainnet-beta)
- `VITE_SANCTUM_API_KEY`: Sanctum Gateway API key
- `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`: Supabase database configuration
- `VITE_VYBE_API_KEY`: Vybe Network API key for Profile module

## Building and Running

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Development Setup
```bash
# Clone the repository
git clone https://github.com/your-org/laniakea.git
cd laniakea

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your API keys
# (See .env.example for required variables)

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Additional Scripts
```bash
# Lint code
npm run lint
```

## Development Conventions

### Naming Conventions
- Components: PascalCase (e.g., `ActionPanel.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useWalletConnection.ts`)
- Types: PascalCase (e.g., `UserProfile.ts`)
- Variables: camelCase

### File Structure
- Component files use PascalCase with `.tsx` extension
- Utility functions use camelCase with `.ts` extension
- Type definition files use PascalCase with `.ts` extension
- All source code is located in `src/` directory

### State Management
- Use Zustand for global state management
- Implement proper TypeScript typing for all state
- Keep state updates atomic and predictable

### Styling
- Use Tailwind CSS utility classes primarily
- Leverage CSS variables defined in tailwind.config.js
- Create custom components following Radix UI patterns
- Maintain consistent design system using the defined color palette

### Error Handling
- Implement proper error boundaries for React components
- Handle blockchain transaction errors gracefully
- Provide user-friendly error messages
- Log errors appropriately for debugging

### TypeScript Usage
- Enable strict mode as per tsconfig
- Define clear interfaces for API responses and state
- Use discriminated unions for complex state management
- Implement proper typing for all external API integrations

### Protocol Integration
- Use official protocol SDKs when available (Drift SDK, Meteora SDK)
- Implement proper error handling and connection management
- Cache data appropriately to reduce RPC calls
- Follow best practices for wallet integration and user security

## Project Architecture

### Frontend Architecture
- React 19 with TypeScript
- Component-based architecture with reusable UI components
- Zustand for global state management
- Custom hooks for blockchain interactions
- Vite for fast development builds

### Blockchain Integration
- Solana Web3.js for base blockchain operations
- Multiple protocol SDKs integrated for cross-protocol functionality
- Wallet adapter for user authentication and transactions
- RPC endpoint management with different endpoints for different protocols

### Data Management
- Supabase for feed and social features
- Local state management for real-time updates
- Caching strategies for blockchain data
- Efficient data fetching and updates

## Key Features

### Current Features (Live)
- Meteora Integration: Manage liquidity pools with enhanced analytics
- Drift Perpetuals: Advanced trading with liquidation markers and TP/SL orders
- Cross-Protocol Portfolio: See all positions in one dashboard
- Market Feed: Real-time news and events with chart annotations

### Planned Features (Roadmap)
- Advanced intelligence (Phase 1): TP/SL orders, candle hover intelligence, IL calculator
- Cross-protocol intelligence (Phase 2): Multi-protocol integration, arbitrage detection
- Intelligent execution (Phase 3): ML-powered alerts, portfolio simulation, auto-optimization

## Deployment

The application is currently deployed at:
- **Launch Dashboard**: https://app.laniakea.fun
- **Landing Page**: https://www.laniakea.fun

## Additional Notes

- The application includes complex polyfill configurations for blockchain operations in browser environments
- Uses Vite's node-polyfills plugin for compatibility
- Implements a sophisticated dark mode design system
- Contains multiple protocol integrations requiring different API keys and configurations