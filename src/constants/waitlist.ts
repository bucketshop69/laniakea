// Waitlist configuration constants
// Use environment variable with fallback to true for default waitlist behavior
export const IS_WAITLIST_ENABLED = 
  import.meta.env.VITE_WAITLIST_ENABLED !== undefined 
    ? import.meta.env.VITE_WAITLIST_ENABLED === 'true' 
    : true; // Default to true if not specified

// Other potential waitlist-related constants
export const WAITLIST_STORAGE_KEY = 'laniakea_waitlist_status';
export const MAX_WAITLIST_ENTRIES = 10000; // Maximum number of entries we plan to handle in initial phase

// Supabase table name for waitlist
export const WAITLIST_TABLE_NAME = 'waitlist_address';