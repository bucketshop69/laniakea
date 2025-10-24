import { create } from 'zustand'
import type { ProfileOverview } from '../types'
import { getProfileOverview } from '../services/profileService'

/**
 * Profile store state and actions
 */
interface ProfileStoreState {
  // State
  overview: ProfileOverview | null
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null

  // Actions
  fetchProfile: (walletAddress: string, force?: boolean) => Promise<void>
  clearProfile: () => void
  setError: (error: string | null) => void
}

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000

/**
 * Profile store with Zustand
 * Manages wallet profile data from Zerion API
 */
export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  // Initial state
  overview: null,
  isLoading: false,
  error: null,
  lastFetchTime: null,

  // Fetch profile data from Zerion API
  fetchProfile: async (walletAddress: string, force = false) => {
    const state = get()

    // Check cache if not forcing refresh
    if (!force && state.lastFetchTime) {
      const timeSinceLastFetch = Date.now() - state.lastFetchTime
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('[ProfileStore] Using cached profile data')
        return
      }
    }

    set({ isLoading: true, error: null })

    try {
      const overview = await getProfileOverview(walletAddress)

      set({
        overview,
        isLoading: false,
        error: null,
        lastFetchTime: Date.now(),
      })
    } catch (error) {
      console.error('[ProfileStore] Failed to fetch profile:', error)

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load profile data'

      set({
        overview: null,
        isLoading: false,
        error: errorMessage,
        lastFetchTime: null,
      })
    }
  },

  // Clear profile data (on wallet disconnect)
  clearProfile: () => {
    console.log('[ProfileStore] Clearing profile data')
    set({
      overview: null,
      isLoading: false,
      error: null,
      lastFetchTime: null,
    })
  },

  // Set error manually
  setError: (error: string | null) => {
    set({ error })
  },
}))
