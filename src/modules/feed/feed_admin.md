# Feed Admin Panel - Feature Requirements

## Phase 1: Basic Feed Management (No AI)

### Milestone 1: Basic Form Interface
- Create a clean dashboard interface for content administrators
- Implement a form with all required fields (title, description, asset, timestamp, category)
- Add form validation for required fields
- Implement real-time validation of data types (e.g., timestamp format)

### Milestone 2: Database Integration
- Connect to Supabase database for feed_items table
- Implement "Publish to Feed" functionality to save manually entered data
- Add basic error handling for database operations
- Verify data structure matches feed item schema

### Milestone 3: Content Management
- Implement "Draft Management" - ability to save items as drafts before publishing
- Add "Item Editing" functionality for existing feed items
- Implement "Item Deletion" capability
- Add confirmation dialogs for destructive actions

### Milestone 4: Content Moderation
- Add content validation before publishing
- Implement a simple review queue for pending items
- Add basic history/versioning support

### Milestone 5: User Experience Enhancements
- Add search and filter functionality for existing feed items
- Implement pagination for managing large numbers of feed items
- Add preview mode to see how feed items will appear
- Improve error handling with user-friendly messages

### Milestone 6: Security Implementation
- Add authentication system for admin access
- Implement session management
- Add role-based access controls if needed
- Add audit logging to track admin actions

## File Structure & Location

All admin panel code should be located in: `src/modules/feed/admin/`

### Expected Files:
- `AdminPanel.tsx` - Main admin panel component
- `types.ts` - TypeScript interfaces for feed items and related data
- `services/feedService.ts` - Database/service layer functions
- `components/` - Any reusable UI components specific to the admin panel
- `hooks/` - Custom React hooks for admin functionality

## Technical Specifications & Developer Guidelines

### Frontend (React/TypeScript) Developer Tasks
- Implement form components using existing UI patterns from the project
- Use Radix UI components and Tailwind CSS styling consistent with the rest of the application
- Implement proper TypeScript interfaces for all data structures
- Handle loading states, error states, and user feedback appropriately
- Follow existing state management patterns using Zustand if applicable

### Backend/Database Developer Tasks  
- Set up the `feed_items` table in Supabase with proper schema:
  ```sql
  CREATE TABLE feed_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    asset TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    category TEXT NOT NULL,
    source TEXT,
    impact TEXT DEFAULT 'neutral', -- bullish, bearish, neutral
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- Implement Row Level Security (RLS) policies for admin access control
- Set up proper indexes for efficient querying (especially on timestamp and asset)
- Create database functions or views for common feed queries if needed

### API Integration Developer Tasks
- Create service layer functions for CRUD operations on feed items
- Implement proper error handling and validation for all operations
- Ensure proper environment variable usage for Supabase configuration
- Add rate limiting or other safeguards as appropriate
- Consider caching strategies for frequently accessed feed data

### Security Developer Tasks
- Implement secure authentication (consider using Supabase Auth or a simple token-based system)
- Add proper input sanitization to prevent injection attacks
- Ensure all database operations are parameterized
- Add logging for admin actions for audit purposes
- Consider implementing CSRF protection if needed

### Additional Considerations
- Environment Variables Required:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anon key for client access
  - `VITE_ADMIN_API_KEY` - Secure API key for admin access (if using token-based auth)
- Data validation requirements: all fields should be properly validated before database insertion
- Error handling: implement comprehensive error handling with user-friendly messages
- Testing: each milestone should include unit tests for business logic and integration tests for database operations

## Questions & Answers by Milestone

### Milestone 1: Basic Form Interface
- **Q: What form library should I use for the admin panel?**
  A: Use React's built-in form capabilities. Consider using react-hook-form if complex form validation is needed.
- **Q: Should the form handle validation on submit or real-time?**
  A: Implement real-time validation for better UX, with additional validation on submit.
- **Q: How should I handle the timestamp field?**
  A: Use an input with type="datetime-local" for easy date/time selection, with validation to ensure proper format.
- **Q: Which UI components should I follow for consistency?**
  A: Follow existing UI patterns from the project, particularly components in src/components/ui/ and styling with Tailwind CSS.

### Milestone 2: Database Integration
- **Q: What's the correct Supabase client setup for this project?**
  A: Use the existing Supabase client setup in src/lib/supabaseClient.ts, following the same pattern used elsewhere in the app.
- **Q: How should I handle database errors?**
  A: Create a unified error response format that returns {success: boolean, error?: string, data?: T} from all service functions.
- **Q: Should I create the database table manually or through this project?**
  A: The Supabase table should be created manually in the Supabase dashboard, then we'll create service functions to interact with it.

### Milestone 3: Content Management
- **Q: How should draft items be stored in the database?**
  A: Use the `published` boolean field in the feed_items table to differentiate between drafts (published=false) and published items (published=true).
- **Q: Should editing happen in a modal or a separate page?**
  A: Consider a modal approach for better UX, but a separate page is acceptable if more complex editing is needed.
- **Q: How do I handle optimistic updates vs. waiting for server response?**
  A: Start with server-response approach for simplicity, implement optimistic updates in later iterations if needed.

### Milestone 4: Content Moderation
- **Q: How should the review queue be implemented?**
  A: Use a view that filters items based on status, or add a status field if more complex workflows are needed.
- **Q: What validation is needed beyond basic form validation?**
  A: Content length limits, XSS prevention, and business rule validation (e.g., required fields, valid timestamp format).

### Milestone 5: User Experience Enhancements
- **Q: How should I implement search functionality?**
  A: Start with client-side search of already-loaded data, then implement server-side search in Supabase if performance becomes an issue.
- **Q: What pagination approach should I use?**
  A: Use offset-based pagination with limit and offset parameters to the database query.
- **Q: How should the preview mode work?**
  A: Create a component that renders feed items exactly as they would appear in the main application, using the same FeedCard component.

### Milestone 6: Security Implementation
- **Q: Should I use Supabase Auth or a custom solution?**
  A: Start with a simple token-based authentication using environment variables for simplicity, plan to upgrade to Supabase Auth for production.
- **Q: How should I store session information?**
  A: Use localStorage for basic session persistence, but implement proper token management for production.
- **Q: Do I need to implement role-based access control from the start?**
  A: A simple admin password/token check is sufficient for initial implementation, role-based access can be added later if needed.

## Phase 2: Enhanced Features (With AI)

### 1. AI-Powered Data Extraction
- **Article Input**: Paste article text directly into the admin panel
- **AI Data Extraction**: Automatically extract structured data (title, description, asset, timestamp, category) from pasted articles using LLM
- **Smart Suggestions**: AI-powered suggestions for categories, assets, and impact classification