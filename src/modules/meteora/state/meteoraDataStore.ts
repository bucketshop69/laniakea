import { create } from 'zustand'
import type { MeteoraPairGroup, MeteoraPool } from '../types/domain'
import { fetchPairGroups, fetchPairGroupPools } from '../services/api'

interface MeteoraDataState {
  pairGroups: MeteoraPairGroup[]
  poolsByPairGroup: Record<string, MeteoraPool[]>
  selectedPool: MeteoraPool | null
  isLoadingPairGroups: boolean
  isLoadingPools: boolean
  error?: string
  lastFetched?: number
}

interface MeteoraDataStore {
  data: MeteoraDataState
  fetchPairGroupsData: (options?: { force?: boolean }) => Promise<void>
  fetchPoolsForPairGroup: (pairGroup: string, options?: { force?: boolean }) => Promise<void>
  setSelectedPool: (pool: MeteoraPool | null) => void
  getPoolsForPairGroup: (pairGroup: string) => MeteoraPool[] | null
}

export const useMeteoraDataStore = create<MeteoraDataStore>((set, get) => ({
  data: {
    pairGroups: [],
    poolsByPairGroup: {},
    selectedPool: null,
    isLoadingPairGroups: false,
    isLoadingPools: false,
  },

  setSelectedPool: (pool) => {
    set((state) => ({
      data: {
        ...state.data,
        selectedPool: pool,
      },
    }))
  },

  getPoolsForPairGroup: (pairGroup: string) => {
    const { data } = get()
    return data.poolsByPairGroup[pairGroup] ?? null
  },

  fetchPairGroupsData: async ({ force } = {}) => {
    const { data } = get()

    // Cache for 60 seconds unless forced
    if (!force && data.lastFetched && Date.now() - data.lastFetched < 60_000) {
      return
    }

    set({
      data: {
        ...data,
        isLoadingPairGroups: true,
        error: undefined,
      },
    })

    try {
      const response = await fetchPairGroups()

      set({
        data: {
          ...get().data,
          pairGroups: response.data,
          isLoadingPairGroups: false,
          error: undefined,
          lastFetched: Date.now(),
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.warn('Meteora pair groups fetch failed.', error)
      set({
        data: {
          ...get().data,
          pairGroups: [],
          isLoadingPairGroups: false,
          error: message,
          lastFetched: Date.now(),
        },
      })
    }
  },

  fetchPoolsForPairGroup: async (pairGroup: string, { force } = {}) => {
    const { data } = get()

    // Check if we already have cached data for this pair group
    if (!force && data.poolsByPairGroup[pairGroup]) {
      return
    }

    set({
      data: {
        ...data,
        isLoadingPools: true,
        error: undefined,
      },
    })

    try {
      const response = await fetchPairGroupPools(pairGroup)

      set({
        data: {
          ...get().data,
          poolsByPairGroup: {
            ...get().data.poolsByPairGroup,
            [pairGroup]: response.data,
          },
          isLoadingPools: false,
          error: undefined,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`Meteora pools fetch failed for pair group ${pairGroup}.`, error)
      set({
        data: {
          ...get().data,
          isLoadingPools: false,
          error: message,
        },
      })
    }
  },
}))
