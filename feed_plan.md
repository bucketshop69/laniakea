# Feed Module - Implementation Plan

## Overview
Feed module provides curated news/events with chart anchoring. Users can click feed items to navigate to price charts at event timestamps and save them as annotations.

---

## Decisions (Approved)

1. **Backend:** Supabase ✅ **COMPLETED**
2. **Chart Navigation:** Single asset route (`/chart/:asset`)
3. **Auth:** Web3 Wallet (Solana) - No email auth needed ✅ **UPDATED**
4. **Content Team:** Supabase Studio UI (manual data entry for now)
5. **Security:** Feed is public read, annotations are user-scoped (by wallet address) ✅ **COMPLETED**
6. **MVP Scope:** No filters/search/likes; include marker toggle and 10-annotation cap

---

## Database Schema

### **Table 1: feed_items**
```sql
CREATE TABLE feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  link text,
  timestamp timestamptz NOT NULL,
  category text[],
  asset_related_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### **Table 2: chart_annotations** ✅ **COMPLETED (Web3 Compatible)**
```sql
CREATE TABLE chart_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- Wallet address (e.g., "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
  asset text NOT NULL,
  timestamp timestamptz NOT NULL,
  note text NOT NULL,
  source text CHECK (source IN ('feed', 'user')) NOT NULL,
  feed_item_id uuid REFERENCES feed_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_annotations_user_asset ON chart_annotations(user_id, asset);
CREATE INDEX idx_annotations_asset_timestamp ON chart_annotations(asset, timestamp);
```

**Note:** `user_id` is a text field storing Solana wallet addresses, not a UUID referencing Supabase auth.

---

## Row-Level Security (RLS) ✅ **COMPLETED**

### **feed_items:**
```sql
-- Public read (no auth required)
CREATE POLICY "Anyone can read feed items"
ON feed_items FOR SELECT USING (true);
```

**Note:** Content team writes are managed manually via Supabase Studio UI. No insert/update/delete policies needed for MVP.

### **chart_annotations:**
```sql
-- Allow anyone to read annotations (permissive for MVP)
CREATE POLICY "Users can read all annotations"
ON chart_annotations FOR SELECT USING (true);

-- Allow anyone to insert annotations (frontend sends wallet address)
CREATE POLICY "Anyone can insert annotations"
ON chart_annotations FOR INSERT WITH CHECK (true);

-- Allow updates (frontend responsible for sending correct wallet address)
CREATE POLICY "Users can update own annotations"
ON chart_annotations FOR UPDATE USING (true);

-- Allow deletes (frontend responsible for sending correct wallet address)
CREATE POLICY "Users can delete own annotations"
ON chart_annotations FOR DELETE USING (true);
```

**Security Note:** These policies are permissive because we're using Web3 wallet auth (not Supabase auth). The frontend is trusted to send the correct wallet address. For production, consider implementing signature verification to prevent spoofing.

---

## Frontend Structure

```
src/
├── modules/
│   └── feed/
│       ├── components/
│       │   ├── FeedPanel.tsx           # Main feed container
│       │   ├── FeedCard.tsx            # Individual feed item
│       │   └── FeedChartIcon.tsx       # Chart navigation button
│       ├── services/
│       │   └── feedService.ts          # Fetch feed data
│       ├── stores/
│       │   └── feedStore.ts            # Feed state management
│       └── types/
│           └── feedTypes.ts
│
├── shared/
│   └── charts/
│       ├── stores/
│       │   └── chartAnnotationStore.ts  # Global annotations
│       ├── services/
│       │   └── annotationService.ts     # CRUD operations
│       └── components/
│           └── AnnotationMarker.tsx     # Visual marker on chart
```

---

## Backend Implementation Status ✅ **ALL PHASES COMPLETED**

### **Phase 1: Supabase Project Setup** ✅
- ✅ Supabase project created
- ✅ Project URL: `https://evsobgwaprptojohwyui.supabase.co`
- ✅ Anon key saved to `.env`

### **Phase 2: Database Schema Creation** ✅
- ✅ `feed_items` table created
- ✅ `chart_annotations` table created (Web3-compatible with `user_id text`)
- ✅ Indexes added for performance

### **Phase 3: Row-Level Security (RLS) Setup** ✅
- ✅ RLS enabled on both tables
- ✅ Public read policy for `feed_items`
- ✅ Permissive policies for `chart_annotations` (Web3 wallet auth)

### **Phase 4: Seed Initial Data** ✅
- ✅ 10 sample feed items inserted covering:
  - Macro events (Fed rate decisions, ETF flows)
  - Solana protocol updates (network upgrades, mobile)
  - DeFi protocol news (Jupiter, Meteora, Drift, MarginFi)
  - Multi-chain events (Ethereum)

### **Phase 5: Environment Configuration** ✅
- ✅ Credentials added to `.env` and `.env.example`
- ✅ Supabase client library already installed (`@supabase/supabase-js`)

---

## What's Ready for Frontend

### **Database Tables (Live & Seeded):**
1. **`feed_items`**: 10 sample news items ready to fetch
2. **`chart_annotations`**: Empty table, ready for user annotations

### **Environment Variables (Set):**
```env
VITE_SUPABASE_URL=https://evsobgwaprptojohwyui.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Supabase Client:**
- Already installed in project
- Ready to initialize and use

---

## Key TypeScript Types

### **Feed Item:**
```typescript
interface FeedItem {
  id: string
  title: string
  description: string | null
  link: string | null
  timestamp: string  // ISO 8601
  category: string[] | null
  asset_related_to: string | null
  created_at: string
  updated_at: string
}
```

### **Chart Annotation:**
```typescript
interface ChartAnnotation {
  id: string
  user_id: string  // Solana wallet address (e.g., "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU")
  asset: string
  timestamp: string  // ISO 8601
  note: string
  source: 'feed' | 'user'
  feed_item_id: string | null
  created_at: string
}
```

---

## User Flows

### **1. Content Team Publishes Feed Item:**
1. Log into Supabase Studio
2. Navigate to `feed_items` table
3. Click "+ Insert row"
4. Fill fields (title, description, link, timestamp, category, asset_related_to)
5. Save → instantly live in app

### **2. User Saves Feed Event to Chart:**
1. User **connects Solana wallet** (Phantom, Solflare, etc.)
2. User scrolls feed, sees item with chart icon
3. Clicks "Save to Chart"
4. Frontend calls:
```javascript
const walletAddress = wallet.publicKey.toString();
await supabase.from('chart_annotations').insert({
  user_id: walletAddress,
  asset: 'SOL',
  timestamp: feedItem.timestamp,
  note: feedItem.title,
  source: 'feed',
  feed_item_id: feedItem.id
});
```
5. Annotation saved with wallet address
6. Chart shows marker at timestamp

### **3. User Views Chart with Annotations:**
1. User connects wallet (gets wallet address)
2. User navigates to `/chart/SOL`
3. Frontend fetches:
   - SOL price data (from oracle/chart library)
   - User's SOL annotations:
```javascript
const walletAddress = wallet.publicKey.toString();
const { data } = await supabase
  .from('chart_annotations')
  .select('*')
  .eq('asset', 'SOL')
  .eq('user_id', walletAddress);
```
4. Chart renders with annotation markers at timestamps
5. Toggle to show/hide markers
6. Max 10 visible at once

---

## Frontend Integration Guide

### **1. Initialize Supabase Client**

Create `src/shared/services/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### **2. Fetch Feed Items**

```typescript
// Fetch all feed items, sorted by timestamp (newest first)
const { data: feedItems, error } = await supabase
  .from('feed_items')
  .select('*')
  .order('timestamp', { ascending: false });

// Fetch feed items for specific asset
const { data: solFeed } = await supabase
  .from('feed_items')
  .select('*')
  .eq('asset_related_to', 'SOL')
  .order('timestamp', { ascending: false });
```

### **3. Save Annotation**

```typescript
// User must have wallet connected
const walletAddress = wallet.publicKey.toString();

const { data, error } = await supabase
  .from('chart_annotations')
  .insert({
    user_id: walletAddress,
    asset: 'SOL',
    timestamp: feedItem.timestamp,
    note: feedItem.title,
    source: 'feed',
    feed_item_id: feedItem.id
  });
```

### **4. Fetch User's Annotations**

```typescript
// Get all annotations for connected wallet
const walletAddress = wallet.publicKey.toString();

const { data: annotations } = await supabase
  .from('chart_annotations')
  .select('*')
  .eq('user_id', walletAddress)
  .eq('asset', 'SOL')  // Filter by asset
  .order('timestamp', { ascending: false });
```

### **5. Delete Annotation**

```typescript
const { error } = await supabase
  .from('chart_annotations')
  .delete()
  .eq('id', annotationId)
  .eq('user_id', walletAddress);  // Safety check
```

---

## MVP Scope

### **Build:**
- ✅ **Backend Setup Complete** (Supabase tables, RLS, seed data)
- Feed UI (scroll, view items)
- Chart icon on feed cards (if `asset_related_to` exists)
- Navigate to `/chart/:asset` on click
- Annotation markers on charts
- Save feed events to chart (requires wallet connection)
- Web3 wallet connection (Phantom, Solflare, etc.)
- Marker toggle
- 10-annotation visible limit

### **Defer:**
- Filtering by category/asset
- Search
- Like/Save functionality
- User-created annotations (manual notes - only feed-based for now)
- Annotation editing/deletion
- Media/images in feed
- Signature verification for annotation writes
- Real-time subscriptions (Supabase Realtime)

---

## Future Enhancements

### **Multiple Assets Per Feed Item**
Currently `asset_related_to` is a single text field. To support multiple assets:

```sql
-- Migration to support multiple assets
ALTER TABLE feed_items
ALTER COLUMN asset_related_to TYPE text[]
USING ARRAY[asset_related_to];
```

Example usage:
```sql
-- "Solana & Ethereum partner on cross-chain bridge"
asset_related_to: ARRAY['SOL', 'ETH']
```

### **AI-Friendly Extensions**
See separate AI roadmap document for:
- Vector embeddings for semantic search (`pgvector` extension)
- AI-generated summaries and sentiment analysis
- User interaction tracking for personalization
- Natural language query interface

---

## Quick Start for Frontend Developers

### **What's Already Done:**
1. ✅ Supabase project live at `https://evsobgwaprptojohwyui.supabase.co`
2. ✅ Environment variables set in `.env`
3. ✅ Database tables created with 10 sample feed items
4. ✅ Supabase client library installed

### **Next Steps:**
1. **Initialize Supabase Client**: Create `src/shared/services/supabase.ts` (see code above)
2. **Test Connection**: Fetch feed items to verify setup works
3. **Build Feed Module**: Follow the structure in "Frontend Structure" section
4. **Integrate Wallet**: Use existing wallet connection to get user address
5. **Wire Up Annotations**: Save/fetch annotations using wallet address as `user_id`

### **Key Differences from Original Plan:**
- 🔄 **Auth changed from email → Web3 wallet**
- 🔄 **`chart_annotations.user_id` is `text` (wallet address), not `uuid`**
- 🔄 **No Supabase auth needed** - frontend manages wallet connection
- 🔄 **RLS policies are permissive** - frontend trusted to send correct wallet address

### **Sample Data Available:**
- 10 feed items spanning Oct 10-19, 2025
- Assets: SOL, BTC, ETH
- Categories: macro, market, protocol, defi, derivatives, ecosystem, lending

### **Testing Queries:**
```sql
-- View all feed items
SELECT * FROM feed_items ORDER BY timestamp DESC;

-- View feed items by asset
SELECT * FROM feed_items WHERE asset_related_to = 'SOL';

-- Test annotation insert (manual)
INSERT INTO chart_annotations (user_id, asset, timestamp, note, source)
VALUES ('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'SOL', '2025-10-15 14:00:00+00', 'Test annotation', 'user');
```

---

## CLIENT-SIDE DEVELOPMENT PHASES

### **Phase 1: Foundation & Setup** (15-20 mins)
**Goal:** Set up Supabase client, TypeScript types, and verify database connection

**Tasks:**
1. Create Supabase client (`src/lib/supabase.ts`)
2. Create TypeScript types (`src/modules/feed/types/feedTypes.ts`)
3. Test database connection with simple query
4. Verify environment variables are loaded

**Deliverables:**
- ✅ Supabase client initialized
- ✅ Types defined for `FeedItem` and `ChartAnnotation`
- ✅ Successful test query to `feed_items` table

**Testing:**
```typescript
// Quick test in browser console
import { supabase } from './lib/supabase'
const { data } = await supabase.from('feed_items').select('*')
console.log(data) // Should return 10 feed items
```

---

### **Phase 2: Feed Services Layer** (30-45 mins)
**Goal:** Create service layer for all feed and annotation operations

**Tasks:**
1. Create `feedService.ts` with methods:
   - `getAllFeedItems()` - Fetch all feed items
   - `getFeedItemsByAsset(asset)` - Filter by asset
   - `getFeedItemsByCategory(category)` - Filter by category
   - `getFeedItemById(id)` - Get single feed item

2. Create `annotationService.ts` with methods:
   - `saveAnnotation()` - Save feed event to chart
   - `getUserAnnotations(walletAddress, asset)` - Fetch user's annotations
   - `deleteAnnotation(id, walletAddress)` - Delete annotation
   - `getAnnotationsByAsset(asset)` - Get all annotations for asset

**Deliverables:**
- ✅ `src/modules/feed/services/feedService.ts`
- ✅ `src/modules/feed/services/annotationService.ts`
- ✅ All methods return typed responses
- ✅ Error handling implemented

**File Structure:**
```
src/modules/feed/
├── services/
│   ├── feedService.ts
│   └── annotationService.ts
```

---

### **Phase 3: State Management (Zustand Stores)** (30-45 mins)
**Goal:** Create Zustand stores for feed and annotation state management

**Tasks:**
1. Create `feedStore.ts`:
   - Feed items state
   - Loading/error states
   - Selected asset/category filters
   - Actions: `loadFeedItems()`, `setFilter()`, `clearFilter()`

2. Create `annotationStore.ts`:
   - User annotations state
   - Loading/error states
   - Selected asset
   - Actions: `loadAnnotations()`, `addAnnotation()`, `deleteAnnotation()`
   - Optional: Persist to localStorage (like meteoraStore)

**Deliverables:**
- ✅ `src/modules/feed/state/feedStore.ts`
- ✅ `src/modules/feed/state/annotationStore.ts`
- ✅ Stores follow existing Zustand patterns
- ✅ Optional: localStorage persistence for feed preferences

**File Structure:**
```
src/modules/feed/
├── state/
│   ├── feedStore.ts
│   └── annotationStore.ts
```

---

### **Phase 4: Feed UI Components** (2-3 hours)
**Goal:** Build feed panel, feed cards, and filters using Tailwind + Radix UI

**Tasks:**
1. **FeedPanel.tsx** - Main container component:
   - Header with title
   - Filter controls (optional for MVP)
   - Scrollable feed list
   - Loading/error states
   - Empty state when no items

2. **FeedCard.tsx** - Individual feed item:
   - Title, description, timestamp
   - Category tags (styled pills)
   - Asset badge (if `asset_related_to` exists)
   - "Save to Chart" button (conditional on wallet connection)
   - "Read More" link (if `link` exists)
   - Hover states and animations

3. **FeedFilters.tsx** (optional for MVP):
   - Asset filter dropdown (SOL, BTC, ETH, All)
   - Category filter dropdown
   - Clear filters button

4. **EmptyFeedState.tsx**:
   - Icon/illustration
   - Message when no feed items

**Deliverables:**
- ✅ `src/modules/feed/components/FeedPanel.tsx`
- ✅ `src/modules/feed/components/FeedCard.tsx`
- ✅ Components styled with Tailwind (match existing design)
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Loading skeletons (optional)

**File Structure:**
```
src/modules/feed/
├── components/
│   ├── FeedPanel.tsx
│   ├── FeedCard.tsx
│   ├── FeedFilters.tsx (optional)
│   └── EmptyFeedState.tsx
```

**Design Requirements:**
- Match existing Meteora/Drift/Saros module styling
- Use Radix UI components where applicable (Button, Badge, Card)
- Tailwind classes for spacing, colors, typography
- Dark mode compatible

---

### **Phase 5: Feed Integration with ActionPanel** (30 mins)
**Goal:** Add "Feed" tab to ActionPanel alongside Manage/Profile

**Tasks:**
1. Add "Feed" tab to ActionPanel tabs
2. Render `FeedPanel` when Feed tab is selected
3. Update tab navigation state
4. Test tab switching

**Deliverables:**
- ✅ Feed tab appears in ActionPanel
- ✅ FeedPanel renders when tab is selected
- ✅ Smooth tab transitions

**Files to Modify:**
- `src/components/ActionPanel.tsx`

---

### **Phase 6: Annotation Components** (1-2 hours)
**Goal:** Create annotation marker components for charts

**Tasks:**
1. **AnnotationMarker.tsx** - Visual marker on chart:
   - Pin/flag icon at timestamp
   - Tooltip on hover showing note
   - Click to view full details
   - Different colors for feed vs user annotations

2. **AnnotationToggle.tsx** - Toggle to show/hide markers:
   - Toggle button in chart toolbar
   - Show count of visible annotations
   - Respect 10-annotation limit

3. **AnnotationTooltip.tsx** - Hover tooltip:
   - Note text
   - Timestamp
   - Source (feed/user)
   - Delete button (if user owns it)

**Deliverables:**
- ✅ `src/shared/charts/components/AnnotationMarker.tsx`
- ✅ `src/shared/charts/components/AnnotationToggle.tsx`
- ✅ Markers visually integrated with existing charts
- ✅ 10-annotation visible limit enforced

**File Structure:**
```
src/shared/charts/
├── components/
│   ├── AnnotationMarker.tsx
│   ├── AnnotationToggle.tsx
│   └── AnnotationTooltip.tsx
```

---

### **Phase 7: Chart Integration** (2-3 hours)
**Goal:** Add annotation layer to existing Drift candlestick chart

**Tasks:**
1. Identify existing chart component (`DriftCandlestickChart.tsx`)
2. Add annotation overlay layer
3. Fetch user annotations when chart loads
4. Render `AnnotationMarker` components at correct timestamps
5. Add toggle to show/hide annotations
6. Handle chart zoom/pan with annotations
7. Add "Save to Chart" flow from feed

**Deliverables:**
- ✅ Annotations display on Drift chart
- ✅ Markers positioned at correct timestamps
- ✅ Toggle annotations on/off
- ✅ Clicking feed "Save to Chart" adds annotation
- ✅ Chart navigation from feed items (optional)

**Files to Modify:**
- `src/modules/drift/components/DriftCandlestickChart.tsx`

**Integration Points:**
```typescript
// In DriftCandlestickChart.tsx
const { publicKey } = useWallet()
const { annotations, loadAnnotations } = useAnnotationStore()

useEffect(() => {
  if (publicKey && currentAsset) {
    loadAnnotations(publicKey.toString(), currentAsset)
  }
}, [publicKey, currentAsset])

// Render annotations as overlay
{annotations.map(ann => (
  <AnnotationMarker
    key={ann.id}
    annotation={ann}
    onDelete={handleDelete}
  />
))}
```

---

### **Phase 8: Wallet Integration & Save Flow** (1 hour)
**Goal:** Wire up wallet connection to enable saving annotations

**Tasks:**
1. Use existing `useWallet()` hook from `@solana/wallet-adapter-react`
2. Show "Connect Wallet" state on FeedCard if not connected
3. Implement "Save to Chart" button click handler:
   - Get wallet address
   - Call `annotationService.saveAnnotation()`
   - Update annotation store
   - Show success toast/notification
4. Handle errors (wallet not connected, save failed)
5. Optional: Navigate to chart after saving

**Deliverables:**
- ✅ "Save to Chart" button functional
- ✅ Wallet connection required to save
- ✅ Success/error notifications
- ✅ Annotations persist to database

**Files to Modify:**
- `src/modules/feed/components/FeedCard.tsx`

---

### **Phase 9: Polish & UX Improvements** (1-2 hours)
**Goal:** Add loading states, error handling, and UX polish

**Tasks:**
1. **Loading States:**
   - Skeleton loaders for feed items
   - Loading spinner for annotations
   - Optimistic updates (show annotation immediately)

2. **Error Handling:**
   - Network error messages
   - Retry logic
   - Fallback UI

3. **Notifications:**
   - Toast notifications for save/delete actions
   - Use existing notification system (if any)

4. **Animations:**
   - Fade in feed items
   - Smooth transitions
   - Marker pulse animation

5. **Accessibility:**
   - Keyboard navigation
   - ARIA labels
   - Focus states

**Deliverables:**
- ✅ Smooth loading experiences
- ✅ Clear error messages
- ✅ Success feedback for actions
- ✅ Accessible components

---

### **Phase 10: Testing & Bug Fixes** (1-2 hours)
**Goal:** End-to-end testing and bug fixes

**Tasks:**
1. **Manual Testing:**
   - Load feed items (verify 10 items display)
   - Test wallet connection flow
   - Save annotation from feed
   - View annotation on chart
   - Delete annotation
   - Toggle annotations on/off
   - Test with multiple wallets
   - Test without wallet connection

2. **Edge Cases:**
   - No feed items (empty state)
   - Feed item without asset (no "Save to Chart" button)
   - Network errors
   - Database errors
   - 10+ annotations (verify limit)

3. **Cross-Browser Testing:**
   - Chrome, Firefox, Safari
   - Mobile browsers

4. **Performance:**
   - Check bundle size impact
   - Optimize re-renders
   - Lazy load feed items if needed

**Deliverables:**
- ✅ All user flows working
- ✅ Edge cases handled
- ✅ No console errors
- ✅ Performance acceptable

---

## Phase Summary & Estimated Timeline

| Phase | Description | Time Estimate | Status |
|-------|-------------|---------------|--------|
| **Phase 1** | Foundation & Setup | 15-20 mins | ⏳ Pending |
| **Phase 2** | Feed Services Layer | 30-45 mins | ⏳ Pending |
| **Phase 3** | State Management | 30-45 mins | ⏳ Pending |
| **Phase 4** | Feed UI Components | 2-3 hours | ⏳ Pending |
| **Phase 5** | ActionPanel Integration | 30 mins | ⏳ Pending |
| **Phase 6** | Annotation Components | 1-2 hours | ⏳ Pending |
| **Phase 7** | Chart Integration | 2-3 hours | ⏳ Pending |
| **Phase 8** | Wallet Integration | 1 hour | ⏳ Pending |
| **Phase 9** | Polish & UX | 1-2 hours | ⏳ Pending |
| **Phase 10** | Testing & Bug Fixes | 1-2 hours | ⏳ Pending |
| **Total** | | **10-16 hours** | |

---

## Dependencies Between Phases

```
Phase 1 (Foundation)
    ↓
Phase 2 (Services) ────┐
    ↓                  │
Phase 3 (State)        │
    ↓                  │
Phase 4 (Feed UI) ─────┤
    ↓                  ↓
Phase 5 (ActionPanel)  Phase 6 (Annotation Components)
                           ↓
                       Phase 7 (Chart Integration)
                           ↓
                       Phase 8 (Wallet Integration)
                           ↓
                       Phase 9 (Polish)
                           ↓
                       Phase 10 (Testing)
```

**Critical Path:** Phase 1 → 2 → 3 → 4 → 5 (for feed display)
**Parallel Work:** Phases 4-6 can be worked on simultaneously by different developers

---

## MVP Success Criteria (Checklist)

### **Feed Display:**
- [ ] Feed items load from Supabase
- [ ] All 10 sample items display correctly
- [ ] Title, description, timestamp visible
- [ ] Category tags display
- [ ] Asset badges display
- [ ] "Read More" links work
- [ ] Empty state when no items
- [ ] Loading state while fetching

### **Annotations:**
- [ ] "Save to Chart" button shows only when wallet connected
- [ ] "Connect Wallet" prompt when not connected
- [ ] Save annotation to database successfully
- [ ] Annotations display on chart at correct timestamp
- [ ] Toggle annotations on/off
- [ ] Max 10 annotations visible at once
- [ ] Delete annotation works

### **Integration:**
- [ ] Feed tab appears in ActionPanel
- [ ] Tab switching works smoothly
- [ ] Wallet integration works with existing wallet provider
- [ ] Chart annotations work with Drift chart
- [ ] No console errors
- [ ] No TypeScript errors

### **UX:**
- [ ] Loading states present
- [ ] Error handling graceful
- [ ] Success notifications work
- [ ] Responsive design (mobile/desktop)
- [ ] Dark mode compatible
- [ ] Accessible (keyboard nav, ARIA)

---

## Phase-by-Phase Approval Process

**How to proceed:**
1. Review this plan
2. Approve or request changes
3. Start Phase 1 (Foundation)
4. Complete Phase 1 deliverables
5. Review Phase 1 output
6. Approve to proceed to Phase 2
7. Repeat for all phases

**After each phase:**
- Demo working features
- Review code
- Test functionality
- Get approval before next phase

---

## Notes for Developer

### **Code Style:**
- Follow existing module patterns (Meteora/Drift/Saros)
- Use Zustand for state (match existing stores)
- Tailwind for styling (match existing components)
- TypeScript strict mode
- ESLint compliant

### **Architecture Decisions:**
- **No React Router**: Use component state for navigation
- **Wallet Provider**: Use existing `@solana/wallet-adapter-react`
- **Chart Library**: Integrate with Lightweight Charts (Drift chart)
- **State Management**: Zustand with optional localStorage persistence
- **UI Components**: Radix UI + Tailwind (match existing design system)

### **Database Queries:**
- All queries use Supabase client
- No direct SQL needed (use Supabase JS SDK)
- RLS policies already configured
- Frontend trusted to send correct wallet address

### **Security Notes:**
- Frontend trusted for wallet address (no signature verification in MVP)
- RLS policies are permissive (consider adding signature verification for production)
- Public read on feed items (no auth needed)
- User annotations scoped by wallet address

---

## Questions Before Starting?

Before beginning Phase 1, confirm:
1. ✅ Supabase credentials in `.env` file?
2. ✅ Wallet provider already set up in app?
3. ✅ Chart component identified (DriftCandlestickChart)?
4. ✅ Design system/style guide clear?
5. ✅ Any specific UI/UX preferences for feed?

**Ready to begin Phase 1?** 🚀
