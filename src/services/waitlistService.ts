// Service for waitlist functionality
// This connects to your backend/Supabase to store wallet addresses

import { createClient } from '@supabase/supabase-js';
import { WAITLIST_TABLE_NAME } from '@/constants/waitlist';

export interface WaitlistEntry {
  id: string;
  wallet_address: string; // Using snake_case to match typical DB conventions
  created_at: string; // ISO string format
}

// Solana address validation function
function isValidSolanaAddress(address: string): boolean {
  // Basic validation: length between 32-44 chars, base58-like characters
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }

  // Basic character check - Solana addresses use base58 encoding
  // which includes alphanumeric characters except 0, O, I, l
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if wallet address already exists in the waitlist
const checkDuplicateAddress = async (walletAddress: string): Promise<boolean> => {
  if (!supabase) {
    console.error('Supabase client not initialized. Check your environment variables.');
    return false; // Assume not duplicate so user can at least try to submit
  }

  try {
    const { data, error } = await supabase
      .from(WAITLIST_TABLE_NAME)
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error on no match

    return !!data; // If data exists, it's a duplicate
  } catch (error) {
    console.error('Error checking duplicate address:', error);
    // If there's an actual error (not just "no match"), return false to allow submission
    return false;
  }
};

export const addWalletToWaitlist = async (walletAddress: string): Promise<{ success: boolean; message: string }> => {
  try {
    // Validate wallet address format (improved Solana validation)
    if (!walletAddress || !isValidSolanaAddress(walletAddress)) {
      return { success: false, message: 'Invalid wallet address format' };
    }

    // Check for duplicate address
    const isDuplicate = await checkDuplicateAddress(walletAddress);
    if (isDuplicate) {
      return { success: false, message: 'Wallet address already exists in waitlist' };
    }

    // If Supabase is configured, add the wallet to the waitlist table
    if (supabase) {
      const { data, error } = await supabase
        .from(WAITLIST_TABLE_NAME)
        .insert([{ wallet_address: walletAddress }]);

      if (error) {
        console.error('Error adding wallet to waitlist:', error);
        return { success: false, message: error.message || 'Failed to add wallet to waitlist' };
      }

      console.log(`Wallet ${walletAddress} successfully added to waitlist`);
      return { success: true, message: 'Successfully added to waitlist' };
    } else {
      // Fallback if Supabase is not configured
      console.error('Supabase not configured. Data not saved.');
      return { success: false, message: 'Service temporarily unavailable. Please try again later.' };
    }
  } catch (error: any) {
    console.error('Error adding wallet to waitlist:', error);
    return { success: false, message: error.message || 'Failed to add wallet to waitlist' };
  }
};