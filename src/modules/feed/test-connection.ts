/**
 * Test file to verify Supabase connection
 * This file can be deleted after Phase 1 verification
 *
 * To test in browser console:
 * 1. Import this file in your app temporarily
 * 2. Call testSupabaseConnection() in console
 * 3. Check if 10 feed items are returned
 */

import { supabase } from '@/lib/supabase'
import type { FeedItem } from './types/feedTypes'

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')

  try {
    const { data, error } = await supabase
      .from('feed_items')
      .select('*')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('❌ Supabase connection error:', error)
      return { success: false, error }
    }

    console.log('✅ Supabase connection successful!')
    console.log(`📊 Found ${data?.length || 0} feed items:`, data)

    return { success: true, data: data as FeedItem[] }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { success: false, error: err }
  }
}

// Auto-run test in development (optional - comment out if not needed)
if (import.meta.env.DEV) {
  console.log('💡 Test Supabase connection by running: testSupabaseConnection()')
}
