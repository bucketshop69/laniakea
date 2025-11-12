# X402 Demo UI - Implementation Plan

## Overview
Build a professional, interactive demo showcasing the x402 payment flow with real-time Solana balance updates and API documentation-style interface.

## Demo Vision
- **API Documentation Card**: Professional API playground (Stripe/Postman style)
- **Live Wallet Balances**: Real-time USDC/SOL balance updates for Data Provider, DAO, and Developer
- **Payment Timeline**: Visual step-by-step flow showing Discovery → Build → Sign → Settle → Access
- **Token Selection**: Toggle between USDC and SOL payments
- **On-Chain Proof**: Real transaction signatures with Solana Explorer links

---

## Top-Level Milestones

### Milestone 1: Project Structure & Dependencies
Setup the demo module structure and install required dependencies.

### Milestone 2: API Documentation Card Component
Build the left-side API playground with request/response display and syntax highlighting.

### Milestone 3: Live Wallet Balances Component
Real-time balance fetching and display for all three parties (Data Provider, DAO, Developer) with animations.

### Milestone 4: Payment Timeline Component
Bottom timeline showing the 5-step payment flow with progress tracking and transaction links.

### Milestone 5: Token Selection & Configuration
Dropdown to switch between USDC and SOL, with fixed split configuration display.

### Milestone 6: State Management & Integration
Connect all components with shared state and implement the full payment flow.

### Milestone 7: Real Data Integration
Wire up actual user insights API endpoint and real payment processing.

### Milestone 8: Polish & Demo Preparation
Animations, loading states, error handling, and demo script preparation.

---

## Detailed Milestones

### Milestone 1: Project Structure & Dependencies

**Goal**: Setup folder structure and install required packages.

#### 1.1 Create Demo Module Structure
- [x] Create `src/modules/x402/components/demo/` directory
- [x] Create component files:
  - [x] `X402DemoPage.tsx` (main container)
  - [x] `ApiDocCard.tsx` (API playground)
  - [x] `WalletBalancesCard.tsx` (balance display)
  - [x] `PaymentTimeline.tsx` (step timeline)
  - [x] `TokenSelector.tsx` (USDC/SOL toggle)
  - [x] `SplitConfigDisplay.tsx` (show 70/20/10)
- [x] Create types file: `src/modules/x402/types/demo.ts`
- [x] Create hooks file: `src/modules/x402/hooks/useDemoPayment.ts`

#### 1.2 Install Dependencies
- [x] Check if `@solana/web3.js` is up to date
- [x] Install syntax highlighting: `react-syntax-highlighter` + `@types/react-syntax-highlighter`
- [x] Install animation library: `framer-motion` (if not already installed)
- [x] Verify existing UI components available (shadcn/ui)

#### 1.3 Setup Route
- [x] Add `/x402-demo` route to React Router
- [x] Add navigation link in main menu/header
- [x] Create basic page layout with grid

#### 1.4 Define TypeScript Types
- [x] Create `DemoState` interface
- [x] Create `WalletBalance` interface
- [x] Create `PaymentStep` enum
- [x] Create `TokenType` type ('USDC' | 'SOL')
- [x] Create `ApiResponse` interfaces

**Estimated Time**: 45 minutes

---

### Milestone 2: API Documentation Card Component

**Goal**: Build professional API docs interface showing request/response.

#### 2.1 Create Base Card Layout
- [ ] Create `ApiDocCard.tsx` with card container
- [ ] Add header: "GET /api/user_insights"
- [ ] Add method badge (GET) with color coding
- [ ] Add endpoint path with copy button
- [ ] Setup tabs: "Request" | "Response"

#### 2.2 Request Section
- [ ] Display request headers:
  - [ ] `Authorization: Bearer <wallet_signature>`
  - [ ] `Accept: application/json`
- [ ] Display query parameters:
  - [ ] `wallet_address` (show connected wallet or demo wallet)
  - [ ] `include` (insights, trades, pins)
- [ ] Add syntax highlighting for code blocks
- [ ] Add copy buttons for code snippets

#### 2.3 Response Section
- [ ] Create response display with syntax highlighting
- [ ] Show 402 Payment Required response initially:
  ```json
  {
    "status": 402,
    "message": "Payment required",
    "x402": {
      "amount": 10000,
      "token": "USDC",
      "facilitator": "http://localhost:3000",
      "splits": [
        { "recipient": "7xKX...3mD", "percentage": 70 },
        { "recipient": "3njb...Vmr", "percentage": 10 },
        { "recipient": "2jri...gTa", "percentage": 20 }
      ]
    }
  }
  ```
- [ ] After payment, show success response with user insights data
- [ ] Add status badge (402 | 200) with color coding

#### 2.4 Action Button
- [ ] Create "Try API Call" button (primary CTA)
- [ ] Add loading state with spinner
- [ ] Add success/error states
- [ ] Disable button during payment flow
- [ ] Add "Reset Demo" button

#### 2.5 Styling
- [ ] Match existing app theme
- [ ] Use monospace font for code blocks
- [ ] Add subtle shadows and borders
- [ ] Responsive design for mobile
- [ ] Dark mode support

**Estimated Time**: 1.5 hours

---

### Milestone 3: Live Wallet Balances Component

**Goal**: Real-time balance display with animations for all three parties.

#### 3.1 Create Balance Card Layout
- [ ] Create `WalletBalancesCard.tsx` with card container
- [ ] Add header: "💰 Live Balances"
- [ ] Create three sections:
  - [ ] Data Provider (User)
  - [ ] DAO Treasury
  - [ ] Developer
- [ ] Add dividers between sections

#### 3.2 Individual Balance Display
- [ ] Create `BalanceRow` sub-component
- [ ] Display:
  - [ ] Icon + Label (📊 Data Provider, 🏛️ DAO, 👨‍💻 Developer)
  - [ ] Wallet address (truncated with copy button)
  - [ ] Before → After balance with arrow
  - [ ] Earned amount (e.g., "+0.007 USDC (70%)")
- [ ] Add token icon (USDC/SOL)

#### 3.3 Real Balance Fetching
- [ ] Create `useWalletBalance` hook
- [ ] Fetch SOL balance using `connection.getBalance()`
- [ ] Fetch USDC balance using `getAccount()` from `@solana/spl-token`
- [ ] Handle account not found errors (no USDC account)
- [ ] Poll balances every 2 seconds during demo
- [ ] Cache balances to detect changes

#### 3.4 Balance Update Animations
- [ ] Detect balance changes (compare before/after)
- [ ] Animate balance increment (counting up effect)
- [ ] Flash green background on balance increase
- [ ] Slide in "+0.007 USDC" earned amount
- [ ] Fade out after 3 seconds

#### 3.5 Hardcoded Wallets
- [ ] Define DAO wallet constant: `DAO_TREASURY_ADDRESS`
- [ ] Define Developer wallet constant: `DEVELOPER_ADDRESS`
- [ ] Data Provider wallet = connected user wallet
- [ ] Add wallet address validation

#### 3.6 Payment Settings Display
- [ ] Show current token selection (USDC/SOL)
- [ ] Show price per request (0.01 USDC)
- [ ] Display split configuration (read-only):
  - [ ] Data Provider: 70%
  - [ ] Developer: 20%
  - [ ] DAO: 10%
- [ ] Add info tooltips explaining each role

**Estimated Time**: 2 hours

---

### Milestone 4: Payment Timeline Component

**Goal**: Visual step-by-step timeline showing payment flow progress.

#### 4.1 Create Timeline Layout
- [ ] Create `PaymentTimeline.tsx` component
- [ ] Full-width container below main cards
- [ ] Header: "Payment Flow Timeline"
- [ ] Horizontal step layout

#### 4.2 Define Payment Steps
- [ ] Step 1: Discovery (Detect payment requirement)
- [ ] Step 2: Build Transaction (Calculate splits + create tx)
- [ ] Step 3: User Signs (Wallet approval)
- [ ] Step 4: Settle (Kora processes + on-chain)
- [ ] Step 5: Access Granted (Data returned)

#### 4.3 Step Component
- [ ] Create `TimelineStep` sub-component
- [ ] Display:
  - [ ] Step number (①, ②, ③, ④, ⑤)
  - [ ] Step title
  - [ ] Step description
  - [ ] Status: pending | active | complete
  - [ ] Timing (e.g., "0.5s")
- [ ] Add progress line connecting steps

#### 4.4 Progress Animation
- [ ] Animate progress bar moving left to right
- [ ] Light up active step (pulsing effect)
- [ ] Check mark animation when step completes
- [ ] Color coding: gray (pending), blue (active), green (complete)

#### 4.5 Transaction Details
- [ ] Show transaction signature when complete
- [ ] Add "View on Solana Explorer" link
- [ ] Format signature with truncation
- [ ] Add copy button for signature
- [ ] Show network (devnet badge)

#### 4.6 Step Timing Tracking
- [ ] Track start time for each step
- [ ] Calculate duration when step completes
- [ ] Display in milliseconds/seconds
- [ ] Store timings in state

**Estimated Time**: 1.5 hours

---

### Milestone 5: Token Selection & Configuration

**Goal**: Token switcher and configuration display.

#### 5.1 Token Selector Component
- [ ] Create `TokenSelector.tsx` dropdown
- [ ] Support two tokens: USDC and SOL
- [ ] Display token icon + name
- [ ] Show current selection in balances
- [ ] Update price display when token changes

#### 5.2 Token Configuration
- [ ] USDC configuration:
  - [ ] Mint address: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (devnet)
  - [ ] Price: 0.01 USDC (10000 units)
  - [ ] Decimals: 6
- [ ] SOL configuration:
  - [ ] Price: 0.00001 SOL (10000 lamports)
  - [ ] Decimals: 9
- [ ] Store selected token in state

#### 5.3 Split Configuration Display
- [ ] Create `SplitConfigDisplay.tsx` component
- [ ] Show read-only split percentages:
  - [ ] Data Provider: 70%
  - [ ] Developer: 20%
  - [ ] DAO: 10%
- [ ] Display as progress bars or percentage badges
- [ ] Add tooltips explaining each role

#### 5.4 Price Display
- [ ] Show "Price per Request" with current token
- [ ] Calculate split amounts based on price:
  - [ ] Data Provider gets: 70% of 0.01 = 0.007 USDC
  - [ ] Developer gets: 20% of 0.01 = 0.002 USDC
  - [ ] DAO gets: 10% of 0.01 = 0.001 USDC
- [ ] Update when token selection changes

**Estimated Time**: 1 hour

---

### Milestone 6: State Management & Integration

**Goal**: Connect all components with shared state and orchestrate payment flow.

#### 6.1 Create Demo State Hook
- [ ] Create `useDemoPayment.ts` hook
- [ ] Define state interface:
  ```typescript
  interface DemoState {
    // API State
    apiStatus: 'idle' | 'requesting' | 'payment_required' | 'processing' | 'success' | 'error';
    responseData: any;

    // Payment State
    currentStep: 0 | 1 | 2 | 3 | 4 | 5;
    stepTimings: number[];
    transactionSignature: string | null;

    // Balance State
    balances: {
      dataProvider: { before: number; after: number };
      dao: { before: number; after: number };
      developer: { before: number; after: number };
    };

    // Configuration
    selectedToken: 'USDC' | 'SOL';
    tokenMint: string;
    pricePerRequest: number;
    splits: { dataProvider: 70; developer: 20; dao: 10 };
  }
  ```
- [ ] Implement state management (useState or Zustand)

#### 6.2 Implement Payment Flow Functions
- [ ] `handleTryApiCall()` - Initiates payment flow
- [ ] `discoverPaymentRequirements()` - Step 1
- [ ] `buildPaymentTransaction()` - Step 2
- [ ] `requestUserSignature()` - Step 3
- [ ] `settleTransaction()` - Step 4
- [ ] `fetchProtectedData()` - Step 5
- [ ] `resetDemo()` - Reset all state

#### 6.3 Balance Management
- [ ] `captureBalancesBefore()` - Snapshot before payment
- [ ] `captureBalancesAfter()` - Snapshot after payment
- [ ] `calculateBalanceChanges()` - Compute differences
- [ ] `updateBalanceAnimations()` - Trigger animations

#### 6.4 Integration in X402DemoPage
- [ ] Use `useDemoPayment` hook
- [ ] Pass state to ApiDocCard
- [ ] Pass state to WalletBalancesCard
- [ ] Pass state to PaymentTimeline
- [ ] Pass state to TokenSelector
- [ ] Handle errors globally

#### 6.5 Event Flow Orchestration
- [ ] User clicks "Try API Call"
  → `apiStatus = 'requesting'`
  → Capture balances before
  → Start step 1
- [ ] Discovery complete
  → `apiStatus = 'payment_required'`
  → Show 402 response
  → Start step 2
- [ ] Transaction built
  → Start step 3
  → Request wallet signature
- [ ] User signs
  → `currentStep = 4`
  → Call facilitator /settle
- [ ] Settlement complete
  → `currentStep = 5`
  → Capture balances after
  → Fetch protected data
  → `apiStatus = 'success'`

**Estimated Time**: 2 hours

---

### Milestone 7: Real Data Integration

**Goal**: Wire up actual API endpoints and real payment processing.

#### 7.1 Create User Insights API Endpoint
- [ ] Create placeholder endpoint in `api/` workspace
- [ ] Route: `GET /api/user_insights`
- [ ] Query params: `wallet_address`, `include`
- [ ] Response structure (placeholder):
  ```json
  {
    "wallet": "7xKX...3mD",
    "insights": {
      "chart_pins": 12,
      "trade_notes": 8,
      "market_annotations": 5
    },
    "activity": {
      "last_active": "2025-01-15T10:30:00Z",
      "total_interactions": 145
    },
    "interests": ["SOL", "USDC", "Meteora", "Drift"],
    "premium_data": {
      "risk_score": 3.2,
      "portfolio_health": "Good",
      "recommended_actions": [
        "Consider diversifying into stablecoins",
        "High correlation with SOL detected"
      ]
    }
  }
  ```
- [ ] Add x402 middleware to protect endpoint
- [ ] Test 402 response without payment

#### 7.2 Integrate Existing x402Service
- [ ] Reuse `X402PaymentService` from `src/modules/x402/services/x402Service.ts`
- [ ] Adapt for demo context:
  - [ ] Use selected token (USDC/SOL)
  - [ ] Use hardcoded DAO + Developer addresses
  - [ ] Use demo price (0.01 USDC or 0.00001 SOL)
- [ ] Call `buildPaymentTransaction()` in step 2
- [ ] Call `submitTransaction()` in step 4

#### 7.3 Real Balance Fetching
- [ ] Implement `fetchSOLBalance(address)`
- [ ] Implement `fetchUSDCBalance(address)`
- [ ] Handle "account not found" for USDC (no token account)
- [ ] Add retry logic for network errors
- [ ] Update balances in real-time during demo

#### 7.4 Transaction Verification
- [ ] Parse transaction signature from settlement response
- [ ] Generate Solana Explorer URL:
  - `https://explorer.solana.com/tx/{signature}?cluster=devnet`
- [ ] Verify transaction confirmed on-chain
- [ ] Display confirmation status

#### 7.5 Error Handling
- [ ] Handle wallet not connected
- [ ] Handle insufficient balance
- [ ] Handle network errors (RPC, facilitator, API)
- [ ] Handle transaction failures
- [ ] Show user-friendly error messages
- [ ] Add retry buttons for recoverable errors

**Estimated Time**: 2 hours

---

### Milestone 8: Polish & Demo Preparation

**Goal**: Animations, loading states, and final demo preparation.

#### 8.1 Loading States
- [ ] Add skeleton loaders for balances
- [ ] Add shimmer effect while fetching
- [ ] Add spinner for API calls
- [ ] Add progress indicators for each step
- [ ] Disable buttons during processing

#### 8.2 Animations & Transitions
- [ ] Smooth transitions between API states
- [ ] Balance increment animation (count-up effect)
- [ ] Green flash on balance increase
- [ ] Timeline progress animation
- [ ] Fade in/out for status messages
- [ ] Confetti/celebration on success (optional)

#### 8.3 Responsive Design
- [ ] Test on mobile (stack components vertically)
- [ ] Test on tablet (adjust grid layout)
- [ ] Test on desktop (side-by-side layout)
- [ ] Ensure buttons are touch-friendly
- [ ] Test with different screen sizes

#### 8.4 Dark Mode Support
- [ ] Verify all components work in dark mode
- [ ] Adjust syntax highlighting colors
- [ ] Ensure proper contrast for readability
- [ ] Test timeline visibility in dark mode

#### 8.5 Demo Script Integration
- [ ] Add tooltips/hints matching demo narration
- [ ] Add "About This Demo" section
- [ ] Create demo walkthrough (first-time user)
- [ ] Add keyboard shortcuts (optional):
  - [ ] `Space` = Start/Pause demo
  - [ ] `R` = Reset demo
  - [ ] `Esc` = Cancel payment

#### 8.6 Testing & Debugging
- [ ] Test full flow end-to-end 5 times
- [ ] Test with different wallets
- [ ] Test with USDC (verify splits work)
- [ ] Test with SOL (if implemented)
- [ ] Test error scenarios (insufficient balance, network error)
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Record demo video for backup

#### 8.7 Documentation
- [ ] Update `kora_x402_setup.md` with demo instructions
- [ ] Create `DEMO_GUIDE.md` with:
  - [ ] How to run the demo
  - [ ] Demo script with timings
  - [ ] Troubleshooting tips
  - [ ] Expected behavior at each step
- [ ] Add inline code comments for complex logic
- [ ] Create README for demo components

#### 8.8 Performance Optimization
- [ ] Memoize expensive calculations
- [ ] Debounce balance polling
- [ ] Lazy load syntax highlighter
- [ ] Optimize re-renders with React.memo
- [ ] Test with React DevTools Profiler

**Estimated Time**: 2 hours

---

## Total Estimated Time

- **Milestone 1**: 45 minutes
- **Milestone 2**: 1.5 hours
- **Milestone 3**: 2 hours
- **Milestone 4**: 1.5 hours
- **Milestone 5**: 1 hour
- **Milestone 6**: 2 hours
- **Milestone 7**: 2 hours
- **Milestone 8**: 2 hours

**Total: ~12.5 hours** (approximately 1.5 days of focused work)

---

## Success Criteria

✅ Professional API documentation interface (Stripe/Postman quality)
✅ Real-time balance updates for all three parties
✅ Smooth payment timeline animation
✅ Support for USDC and SOL payments
✅ Real transaction confirmation with Explorer links
✅ 70/20/10 split correctly distributed on-chain
✅ Demo runs flawlessly for 3-minute presentation
✅ Mobile responsive and dark mode compatible

---

## Demo Day Checklist

**Before Demo:**
- [ ] Fund all wallets (Data Provider, DAO, Developer) with initial balances
- [ ] Verify Kora RPC is running and healthy
- [ ] Verify Facilitator is running on port 3000
- [ ] Verify API server is running on port 4021
- [ ] Test full flow 3 times to ensure stability
- [ ] Have backup video ready (in case of network issues)
- [ ] Prepare talking points for each component

**During Demo:**
- [ ] Show API docs card (explain protected endpoint)
- [ ] Show live balances (highlight real-time updates)
- [ ] Click "Try API Call" and narrate each step
- [ ] Point out balance increases as payment settles
- [ ] Show transaction on Solana Explorer (proof it's real)
- [ ] Emphasize 70/20/10 split (users earn from their data)

**After Demo:**
- [ ] Answer questions about implementation
- [ ] Share GitHub repo link
- [ ] Share demo URL (if deployed)
- [ ] Collect feedback

---

## Next Steps

Once this demo is complete, potential future enhancements:
- **Milestone 9**: Payment history table (show all past payments)
- **Milestone 10**: User settings (customize splits, whitelist agents)
- **Milestone 11**: Multi-token support (BONK, JUP, etc.)
- **Milestone 12**: AI agent simulation (automated requests)
- **Milestone 13**: Analytics dashboard (earnings over time)

---

**Ready to start building? 🚀**

Suggested order:
1. Milestone 1 (setup) → 45 min
2. Milestone 2 (API card) → 1.5 hr ← **Start here**
3. Milestone 3 (balances) → 2 hr
4. Milestone 6 (state mgmt) → 2 hr
5. Milestone 4 (timeline) → 1.5 hr
6. Milestone 7 (real data) → 2 hr
7. Milestone 5 (token selector) → 1 hr
8. Milestone 8 (polish) → 2 hr
