# x402 Hackathon Implementation Plan

## Overview
Build a payment-gated API that allows AI agents to autonomously pay for wallet overview data using the x402 protocol. The system will demonstrate micropayments with automatic payment splitting across multiple accounts.

## Core Concept
- **Endpoint**: `/wallet_overview`
- **Input**: Wallet address
- **Output**: Wallet data (from Vybe API) + user interests/annotations (from feed system)
- **Payment**: x402 standard with Kora as facilitator
- **Feature**: Payment splitting across multiple accounts (platform fee, data provider, etc.)

## Requirements

### Technical Stack
- **Frontend**: Existing React + Vite app (visualization/UI)
- **Backend API**: Express server with x402-express middleware
- **Facilitator**: Custom Node.js service wrapping Kora
- **Infrastructure**: Kora RPC server for gasless transactions
- **Blockchain**: Solana Devnet
- **Payment Token**: USDC/sol/$cash etc

### Data Sources
- Vybe API (wallet balance, token count, value)
- Supabase feed system (user interests, asset interactions)

### Monorepo Structure
```
laniakea/
├── src/               # Frontend (existing)
├── api/               # Protected API server
├── facilitator/       # x402 facilitator service
├── client-demo/       # AI agent simulation
└── kora/              # Kora configuration
```

---

## Milestones: Zero to One

### Milestone 1: Project Structure & Dependencies

#### 1.1 Configure Monorepo Workspace
- [ ] Update root `package.json` to add pnpm workspaces configuration
- [ ] Add workspace paths: `"workspaces": ["api", "facilitator", "client-demo"]`
- [ ] Create `.npmrc` file if needed for workspace settings

#### 1.2 Create Folder Structure
- [ ] Create `api/` directory with basic structure
  - [ ] `api/package.json`
  - [ ] `api/src/` directory
  - [ ] `api/tsconfig.json`
- [ ] Create `facilitator/` directory with basic structure
  - [ ] `facilitator/package.json`
  - [ ] `facilitator/src/` directory
  - [ ] `facilitator/tsconfig.json`
- [ ] Create `client-demo/` directory with basic structure
  - [ ] `client-demo/package.json`
  - [ ] `client-demo/src/` directory
  - [ ] `client-demo/tsconfig.json`
- [ ] Create `kora/` directory for configuration files
  - [ ] `kora/.env.example`
  - [ ] `kora/kora.toml` (placeholder)
  - [ ] `kora/signers.toml` (placeholder)

#### 1.3 Install Dependencies

**API workspace:**
- [ ] Install core: `express`, `cors`, `dotenv`
- [ ] Install x402: `@faremeter/middleware` (or equivalent x402-express package)
- [ ] Install Solana: `@solana/web3.js`
- [ ] Install dev deps: `@types/express`, `@types/cors`, `@types/node`, `tsx`, `typescript`

**Facilitator workspace:**
- [ ] Install core: `express` or `fastify`, `cors`, `dotenv`
- [ ] Install Kora SDK: `@kora/sdk` (will build this in Milestone 2)
- [ ] Install Solana: `@solana/web3.js`
- [ ] Install dev deps: `@types/express`, `@types/node`, `tsx`, `typescript`

**Client Demo workspace:**
- [ ] Install x402 client: `@faremeter/client` (or x402 fetch wrapper)
- [ ] Install Solana: `@solana/web3.js`
- [ ] Install utilities: `dotenv`, `chalk` (for colored console output)
- [ ] Install dev deps: `@types/node`, `tsx`, `typescript`

#### 1.4 Configure TypeScript
- [ ] Create `api/tsconfig.json` with Node.js settings
- [ ] Create `facilitator/tsconfig.json` with Node.js settings
- [ ] Create `client-demo/tsconfig.json` with Node.js settings
- [ ] Ensure all configs target ES2022+ and use module: "NodeNext"

#### 1.5 Add Scripts
- [ ] Add scripts to root `package.json`:
  - `"dev:api"` - run API server
  - `"dev:facilitator"` - run facilitator
  - `"demo"` - run client demo
  - `"install:all"` - install all workspace dependencies
- [ ] Add scripts to each workspace `package.json`:
  - `"dev"` - development mode with auto-reload
  - `"build"` - compile TypeScript
  - `"start"` - run compiled code

#### 1.6 Setup Environment Files
- [ ] Create `.env.example` in root with all required variables
- [ ] Create `.env` in root (gitignored)
- [ ] Add placeholder values for:
  - `KORA_SIGNER_ADDRESS`
  - `KORA_SIGNER_PRIVATE_KEY`
  - `PAYER_ADDRESS`
  - `PAYER_PRIVATE_KEY`
  - `KORA_API_KEY`
  - `VYBE_API_KEY` (from existing project)
  - Network configs

#### 1.7 Verify Setup
- [ ] Run `pnpm install` from root to verify workspace setup
- [ ] Verify all workspaces are recognized: `pnpm -r list`
- [ ] Create simple "Hello World" entry point in each workspace
- [ ] Test running each workspace independently

### Milestone 2: Kora Infrastructure Setup

#### 2.1 Clone and Build Kora
- [ ] Clone Kora repository: `git clone https://github.com/solana-foundation/kora.git`
- [ ] Navigate to Kora directory: `cd kora`
- [ ] Checkout release branch: `git checkout release/feature-freeze-for-audit`
- [ ] Build Kora: `make install`
- [ ] Verify installation: `kora --version`
- [ ] Return to project root

#### 2.2 Generate Keypairs
- [ ] Create keypair generation script in `kora/scripts/generate-keypairs.js`
- [ ] Generate Kora signer keypair
- [ ] Generate payer keypair
- [ ] Display addresses and private keys
- [ ] Save addresses to .env file automatically
- [ ] Provide instructions for manual .env update if needed

#### 2.3 Configure Kora Files
- [ ] Review and verify `kora/kora.toml` settings:
  - Network set to "devnet"
  - Port 8080
  - API key matches .env
  - Allowed tokens include USDC devnet mint
  - Allowed programs (System, Token, AToken, ComputeBudget)
  - Fee payer policy configured (no SOL transfers)
- [ ] Review and verify `kora/signers.toml`:
  - Signer type is "memory"
  - Environment variable matches: `KORA_SIGNER_PRIVATE_KEY`
  - Weight set to 1
- [ ] Ensure private keys in .env match signers.toml configuration

#### 2.4 Fund Devnet Accounts
- [ ] Get Kora signer address from .env
- [ ] Airdrop devnet SOL to Kora signer (minimum 2 SOL for fees):
  - Option 1: `solana airdrop 2 <KORA_SIGNER_ADDRESS> --url devnet`
  - Option 2: Use Solana faucet website
- [ ] Verify SOL balance: `solana balance <KORA_SIGNER_ADDRESS> --url devnet`
- [ ] Get payer address from .env
- [ ] Request devnet USDC from Circle faucet:
  - Visit: https://faucet.circle.com/
  - Select "Solana Devnet"
  - Enter payer address
  - Request USDC (should receive 10 USDC)
- [ ] Verify USDC balance using Solana explorer or CLI

#### 2.5 Build Kora SDK (for Facilitator)
- [ ] Navigate to Kora SDK directory: `cd kora/sdk/ts`
- [ ] Install dependencies: `pnpm install`
- [ ] Build SDK: `pnpm build`
- [ ] Link SDK locally for use in facilitator: `pnpm link --global`
- [ ] In facilitator workspace: `pnpm link @kora/sdk --global`
- [ ] Verify SDK is available in facilitator node_modules

#### 2.6 Start and Test Kora RPC Server
- [ ] From kora/ directory, copy .env from root: `cp ../.env .`
- [ ] Start Kora RPC server: `kora start --config kora.toml --signers signers.toml`
- [ ] Verify server logs show:
  - "RPC server started on 0.0.0.0:8080"
  - Network: devnet
  - Signer loaded successfully
- [ ] Test health endpoint: `curl http://localhost:8080/health`
- [ ] Test signer info: Check that signer address matches .env
- [ ] Keep Kora running in dedicated terminal window

#### 2.7 Document Kora Setup
- [ ] Create `kora/README.md` with:
  - Quick start commands
  - How to fund accounts
  - How to start Kora server
  - Troubleshooting common issues
- [ ] Add Kora start command to root package.json scripts
- [ ] Update main README with Kora setup section

### Milestone 3: Facilitator Service (Payment Splitting)

#### 3.1 Setup Facilitator Project Structure
- [ ] Install Kora SDK in facilitator workspace:
  - Navigate to facilitator directory
  - Link or copy Kora SDK from `kora-source/sdks/ts/dist`
  - Add to package.json dependencies
- [ ] Create service structure:
  - [ ] `src/services/koraService.ts` - Kora RPC client wrapper
  - [ ] `src/services/paymentSplitter.ts` - Payment splitting logic
  - [ ] `src/routes/facilitator.ts` - x402 endpoints
  - [ ] `src/types/x402.ts` - Type definitions
  - [ ] `src/utils/transaction.ts` - Transaction helpers

#### 3.2 Implement Kora Service Client
- [ ] Create KoraService class in `src/services/koraService.ts`:
  - [ ] Initialize Kora SDK client with RPC URL and API key
  - [ ] Implement `signTransaction()` method (for verification)
  - [ ] Implement `signAndSendTransaction()` method (for settlement)
  - [ ] Implement `getPayerSigner()` method (get fee payer address)
  - [ ] Add error handling and logging
  - [ ] Add connection health check

#### 3.3 Implement Payment Splitting Logic
- [ ] Create PaymentSplitter service in `src/services/paymentSplitter.ts`:
  - [ ] Define split configuration (platform fee %, data provider %, etc.)
  - [ ] Implement `createSplitInstructions()` method:
    - Takes payment amount and recipient addresses
    - Returns Solana transfer instructions for each split
  - [ ] Add validation for split percentages (must total 100%)
  - [ ] Support multiple split recipients
  - [ ] Add logging for split amounts

#### 3.4 Implement /supported Endpoint
- [ ] Create facilitator routes in `src/routes/facilitator.ts`
- [ ] Implement GET `/supported`:
  - [ ] Return x402 version supported
  - [ ] Return payment scheme: "exact"
  - [ ] Return network: "solana-devnet"
  - [ ] Fetch and return fee payer address from Kora
  - [ ] Return supported tokens (USDC devnet mint)
  - [ ] Add proper error handling

#### 3.5 Implement /verify Endpoint
- [ ] Implement POST `/verify`:
  - [ ] Parse x402 payment payload from request body
  - [ ] Extract Solana transaction from payload
  - [ ] Validate transaction structure:
    - Check fee payer matches Kora signer
    - Check payment amount is correct
    - Check recipient addresses
  - [ ] Use Kora's `signTransaction()` to verify (without broadcasting)
  - [ ] Return `{ isValid: boolean, reason?: string }`
  - [ ] Add comprehensive error handling

#### 3.6 Implement /settle Endpoint (with Payment Splitting)
- [ ] Implement POST `/settle`:
  - [ ] Parse x402 payment payload from request body
  - [ ] Extract base transaction from payload
  - [ ] **Add payment split instructions** to transaction:
    - Call PaymentSplitter to get split instructions
    - Append instructions to transaction
  - [ ] Use Kora's `signAndSendTransaction()` to submit
  - [ ] Wait for transaction confirmation
  - [ ] Return transaction signature
  - [ ] Add error handling for network issues
  - [ ] Add logging for each split

#### 3.7 Testing and Integration
- [ ] Create test script in `facilitator/test/`:
  - [ ] Test /supported endpoint
  - [ ] Test /verify with valid transaction
  - [ ] Test /verify with invalid transaction
  - [ ] Test /settle with payment splitting
  - [ ] Verify splits on Solana explorer
- [ ] Integration test with Kora:
  - [ ] Start Kora RPC server
  - [ ] Start facilitator service
  - [ ] Run test suite
  - [ ] Verify all endpoints working
- [ ] Document payment split configuration in README

### Milestone 4: Protected API with Wallet Overview

#### 4.1 Setup API Project Structure & Dependencies
- [ ] Install x402 packages in API workspace:
  - Research available x402 middleware packages
  - Install x402-express or equivalent middleware
  - Add any required x402 types/utilities
- [ ] Install additional dependencies:
  - [ ] `axios` or `node-fetch` for HTTP requests
  - [ ] `@supabase/supabase-js` for database (reuse existing)
- [ ] Create directory structure:
  - [ ] `src/services/` directory
  - [ ] `src/routes/` directory
  - [ ] `src/types/` directory
  - [ ] `src/middleware/` directory

#### 4.2 Adapt Vybe Service (Copy from Frontend)
- [ ] **Copy existing code** from `src/modules/profile/services/profileService.ts`:
  - [ ] Copy entire file to `api/src/services/vybeService.ts`
  - [ ] Replace `import.meta.env` with `process.env`
  - [ ] Replace browser `fetch` with `axios` or `node-fetch`
  - [ ] Update imports for Node.js environment
  - [ ] Keep existing functions as-is:
    - `fetchWalletBalance()` ✓
    - `transformVybeResponse()` ✓
    - `getProfileOverview()` ✓
  - [ ] Test with sample wallet address

#### 4.3 Adapt Feed Service (Copy from Frontend)
- [ ] **Copy Supabase setup** from `src/modules/feed/services/feedService.ts`:
  - [ ] Copy Supabase client initialization to `api/src/services/supabaseClient.ts`
  - [ ] Update environment variables for Node.js
- [ ] Create `api/src/services/userInterestsService.ts`:
  - [ ] Import Supabase client
  - [ ] **Adapt existing query methods** for user interests:
    - Copy pattern from `getFeedItemsByAsset()`
    - Create `getUserInterestsByWallet(walletAddress)`:
      - Query feed_items table (reuse existing table structure)
      - Group by asset/category
      - Return top interests
  - [ ] Keep it simple - reuse existing feed query patterns
  - [ ] Add basic error handling (copy from feedService)

#### 4.4 Create Wallet Overview Service
- [ ] Create `walletService.ts` to combine data:
  - [ ] Implement `getWalletOverview(walletAddress)`:
    - Fetch wallet data from Vybe API
    - Fetch user interests from feed system
    - Combine into unified response
  - [ ] Define response structure:
    - Wallet info (balance, token count, value, change)
    - User interests (top assets, categories)
    - Metadata (timestamp, data sources)
  - [ ] Add validation for wallet address format
  - [ ] Add comprehensive error handling
  - [ ] Add logging for debugging

#### 4.5 Implement x402 Payment Middleware
- [ ] Configure x402 middleware in `src/middleware/x402.ts`:
  - [ ] Set up payment configuration:
    - Facilitator URL (http://localhost:3000)
    - Payment recipient address
    - Network (solana-devnet)
  - [ ] Define pricing for /wallet_overview:
    - Set price (e.g., $0.01 or 0.001 SOL)
    - Configure payment token (USDC)
  - [ ] Configure payment split recipients:
    - Platform fee account
    - Data provider account
    - Any other split accounts
  - [ ] Add middleware error handling
  - [ ] Test middleware with mock requests

#### 4.6 Implement /wallet_overview Endpoint
- [ ] Create wallet routes in `src/routes/wallet.ts`:
  - [ ] Implement GET/POST `/wallet_overview`:
    - Accept wallet address as parameter/body
    - Validate wallet address format
    - Call walletService.getWalletOverview()
    - Return combined data
  - [ ] Apply x402 middleware to protect endpoint
  - [ ] Add request validation
  - [ ] Add response formatting
  - [ ] Add proper HTTP status codes
  - [ ] Add CORS configuration for frontend access

#### 4.7 Integration and Testing
- [ ] Update main API entry point (`src/index.ts`):
  - Import and mount wallet routes
  - Configure x402 middleware globally or per-route
  - Add health check endpoint
  - Add API documentation endpoint
- [ ] Create test script in `api/test/`:
  - [ ] Test /wallet_overview without payment (expect 402)
  - [ ] Test /wallet_overview with payment (expect 200)
  - [ ] Test with valid wallet address
  - [ ] Test with invalid wallet address
  - [ ] Verify response structure
  - [ ] Verify data accuracy
- [ ] End-to-end integration test:
  - [ ] Start Kora RPC server
  - [ ] Start facilitator service
  - [ ] Start API server
  - [ ] Run test suite
  - [ ] Verify payment flow works
  - [ ] Verify data is correct
- [ ] Document API endpoint in README:
  - Endpoint URL and method
  - Request format
  - Response format
  - Payment requirements
  - Example usage

### Milestone 5: AI Agent Demo Client

#### 5.1 Setup Client Dependencies & Structure
- [ ] Install required packages in client-demo workspace:
  - [ ] `@solana/web3.js` (already installed)
  - [ ] `axios` for HTTP requests
  - [ ] `chalk` for colored console output (already installed)
  - [ ] `bs58` for base58 encoding
- [ ] Create file structure:
  - [ ] `src/index.ts` - Main demo script
  - [ ] `src/x402Client.ts` - x402 payment wrapper
  - [ ] `src/utils/solana.ts` - Solana transaction helpers
  - [ ] `src/config.ts` - Configuration constants

#### 5.2 Implement Solana Transaction Utilities
- [ ] Create `src/utils/solana.ts`:
  - [ ] Function to load keypair from private key (env)
  - [ ] Function to create payment transaction:
    - Create transfer instruction with payment amount
    - Set fee payer
    - Add recent blockhash
  - [ ] Function to sign transaction with payer keypair
  - [ ] Function to serialize transaction for x402 headers
  - [ ] Add proper error handling

#### 5.3 Implement x402 Payment Client
- [ ] Create `src/x402Client.ts`:
  - [ ] **x402FetchWithPayment()** function:
    - First, try request without payment (expect 422/402)
    - Parse payment requirements from response
    - Create payment transaction with facilitator info
    - Sign transaction with payer keypair
    - Retry request with payment headers:
      - `x-payment-token`: payment token
      - `x-payment-tx`: base64 transaction
    - Return successful response
  - [ ] Helper: `parsePaymentRequirements()` - extract from 422 response
  - [ ] Helper: `createPaymentTransaction()` - build Solana tx
  - [ ] Helper: `addPaymentHeaders()` - attach to request
  - [ ] Add comprehensive logging for each step

#### 5.4 Create Configuration
- [ ] Create `src/config.ts`:
  - [ ] Load from environment variables:
    - `PAYER_PRIVATE_KEY` - AI agent's keypair
    - `API_URL` - Protected API endpoint
    - `FACILITATOR_URL` - Facilitator service
    - `NETWORK` - Solana network (devnet)
  - [ ] Define test wallet addresses for demo
  - [ ] Define test user IDs
  - [ ] Add validation for required config

#### 5.5 Implement Demo Flow Script
- [ ] Create main demo script in `src/index.ts`:
  - [ ] **Step 1: Introduction**
    - Display demo header with chalk
    - Show configuration (network, addresses)
    - Explain what will happen
  - [ ] **Step 2: Request without payment**
    - Make GET request to `/api/wallet_overview`
    - Expect 422 Payment Required
    - Display payment requirements
    - Show that access is denied
  - [ ] **Step 3: Request with x402 payment**
    - Use `x402FetchWithPayment()` to make paid request
    - Show payment transaction being created
    - Show transaction signature
    - Display success message
  - [ ] **Step 4: Display wallet overview response**
    - Format and display wallet data
    - Display user interests
    - Display recommendations
  - [ ] **Step 5: Show transaction on explorer**
    - Generate Solana explorer link
    - Display payment split verification link
    - Show success summary

#### 5.6 Add Visual Formatting
- [ ] Use chalk for colored output:
  - [ ] Blue for headers/sections
  - [ ] Green for success messages
  - [ ] Red for errors/payment required
  - [ ] Yellow for warnings/info
  - [ ] Cyan for data display
- [ ] Create formatted output functions:
  - [ ] `displayHeader()` - section headers
  - [ ] `displayWalletData()` - format wallet info
  - [ ] `displayInterests()` - format user interests
  - [ ] `displayRecommendations()` - format recommendations
  - [ ] `displayTransactionLink()` - Solana explorer link

#### 5.7 Testing & Error Handling
- [ ] Add error handling for common scenarios:
  - [ ] Missing environment variables
  - [ ] Invalid keypair
  - [ ] API server not running
  - [ ] Facilitator not running
  - [ ] Kora not running
  - [ ] Insufficient funds
  - [ ] Network errors
- [ ] Test the complete flow:
  - [ ] Run with all services (Kora, Facilitator, API)
  - [ ] Verify 422 response without payment
  - [ ] Verify 200 response with payment
  - [ ] Verify transaction on Solana explorer
  - [ ] Verify payment splits on-chain
- [ ] Create README with:
  - [ ] Prerequisites
  - [ ] Environment setup
  - [ ] How to run the demo
  - [ ] Expected output

### Milestone 6: Integration Testing & Demo Prep

#### 6.1 Prepare Environment & Services
- [ ] Verify all environment variables are set in root `.env`:
  - [ ] KORA_SIGNER_ADDRESS
  - [ ] KORA_SIGNER_PRIVATE_KEY
  - [ ] PAYER_ADDRESS
  - [ ] PAYER_PRIVATE_KEY
  - [ ] KORA_API_KEY
  - [ ] VYBE_API_KEY
  - [ ] FACILITATOR_URL
  - [ ] Network settings
- [ ] Fund accounts if needed:
  - [ ] Check Kora signer SOL balance
  - [ ] Check payer USDC balance
  - [ ] Airdrop more if low

#### 6.2 Test Individual Services
- [ ] **Terminal 1: Test Kora RPC**
  - [ ] Start Kora: `cd kora-source && kora start --config ../kora/kora.toml --signers ../kora/signers.toml`
  - [ ] Verify logs show "RPC server started on 0.0.0.0:8080"
  - [ ] Test health: `curl http://localhost:8080/health`
  - [ ] Keep running
- [ ] **Terminal 2: Test Facilitator**
  - [ ] Start: `pnpm --filter facilitator dev`
  - [ ] Verify: "Facilitator service running on port 3000"
  - [ ] Test /supported: `curl http://localhost:3000/supported`
  - [ ] Keep running
- [ ] **Terminal 3: Test API**
  - [ ] Start: `pnpm --filter api dev`
  - [ ] Verify: "API server running on port 4021"
  - [ ] Test health: `curl http://localhost:4021/`
  - [ ] Test without payment: `curl http://localhost:4021/api/wallet_overview?wallet_address=test&user_id=test`
  - [ ] Expect 422 Payment Required
  - [ ] Keep running

#### 6.3 End-to-End Payment Flow Test
- [ ] **Terminal 4: Run Client Demo**
  - [ ] Run: `pnpm --filter client-demo start`
  - [ ] Verify Step 1: Payment discovery works
  - [ ] Verify Step 2: Transaction builds with splits
  - [ ] Verify Step 3: Transaction verification succeeds
  - [ ] Verify Step 4: Transaction settlement succeeds
  - [ ] Verify Step 5: Protected resource accessed
  - [ ] Capture transaction signature from output
  - [ ] Note any errors or failures

#### 6.4 Verify On-Chain Payment Splits
- [ ] Open Solana Explorer (devnet):
  - [ ] Go to: `https://explorer.solana.com/?cluster=devnet`
  - [ ] Search for transaction signature from client demo
  - [ ] Verify transaction exists and confirmed
- [ ] Check payment splits:
  - [ ] Verify 3 transfer instructions in transaction
  - [ ] Verify amounts match configured percentages:
    - 50% to platform recipient
    - 30% to data provider
    - 20% to referral recipient
  - [ ] Take screenshot for demo

#### 6.5 Create Demo Run Script
- [ ] Create `run-demo.sh` in root:
  - [ ] Script to check if all services are running
  - [ ] Display status of each service
  - [ ] Instructions to start each service in order
  - [ ] Wait commands between starts
  - [ ] Final command to run client demo
- [ ] Test the script end-to-end
- [ ] Make it executable: `chmod +x run-demo.sh`

#### 6.6 Document Demo Flow
- [ ] Create `DEMO.md` in root:
  - [ ] **Prerequisites section**:
    - Services running (Kora, Facilitator, API)
    - Accounts funded
    - Environment configured
  - [ ] **Running the Demo section**:
    - Step-by-step terminal commands
    - Expected output for each step
    - What to look for (payment splits, transaction signature)
  - [ ] **Troubleshooting section**:
    - Common errors and fixes
    - How to check service status
    - How to restart services
  - [ ] **Architecture Diagram**:
    - ASCII diagram of component flow
    - Ports and connections

#### 6.7 Prepare Presentation Materials
- [ ] Create presentation flow document:
  - [ ] 1. Introduction (30 sec)
    - Problem: AI agents need to autonomously pay for APIs
    - Solution: x402 + Kora + Payment Splitting
  - [ ] 2. Architecture Overview (60 sec)
    - Show component diagram
    - Explain each layer
  - [ ] 3. Live Demo (2 min)
    - Show all 4 terminals
    - Run client demo
    - Explain each step as it happens
  - [ ] 4. Payment Splits Verification (60 sec)
    - Open Solana Explorer
    - Show transaction with splits
    - Highlight payment distribution
  - [ ] 5. Key Features (30 sec)
    - Autonomous payments
    - Gasless transactions
    - Payment splitting
- [ ] Collect demo artifacts:
  - [ ] Screenshot: All 4 terminals running
  - [ ] Screenshot: Client demo output
  - [ ] Screenshot: Solana Explorer with splits
  - [ ] Transaction signature example
- [ ] Prepare talking points document

---

## Success Criteria
- ✅ AI agent successfully pays for `/wallet_overview` endpoint
- ✅ Payment automatically splits to multiple accounts
- ✅ Response includes wallet data + user interests
- ✅ All transactions visible on Solana devnet explorer
- ✅ Demo runs smoothly in 5-minute presentation

---

## Estimated Timeline
- **Milestone 1**: 1-2 hours
- **Milestone 2**: 1-2 hours
- **Milestone 3**: 3-4 hours (most complex)
- **Milestone 4**: 2-3 hours
- **Milestone 5**: 1-2 hours
- **Milestone 6**: 1-2 hours

**Total**: ~10-15 hours (1-2 days of focused work)
