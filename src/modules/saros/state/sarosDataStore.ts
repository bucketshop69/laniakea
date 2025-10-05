import { create } from 'zustand'

import type { SarosPoolOverview } from '@/modules/saros/types/domain'

const SAROS_POOLS_ENDPOINT = 'https://api.saros.xyz/api/dex-v3/pool'
const DEFAULT_QUERY = 'size=20&order=-volume24h&page=1'

interface SarosDataState {
  pools: SarosPoolOverview[]
  isLoading: boolean
  error?: string
  lastFetched?: number
  lastQuery?: string
  selectedPool: SarosPoolOverview | null
}

interface SarosDataStore {
  data: SarosDataState
  fetchPools: (options?: { force?: boolean; endpointOverride?: string }) => Promise<void>
  setSelectedPool: (pool: SarosPoolOverview | null) => void
}

export const useSarosDataStore = create<SarosDataStore>((set, get) => ({
  data: {
    pools: [],
    isLoading: false,
    selectedPool: null,
  },
  setSelectedPool: (pool) => {
    set((state) => ({
      data: {
        ...state.data,
        selectedPool: pool,
      },
    }))
  },
  fetchPools: async ({ force, endpointOverride } = {}) => {
    const { data } = get()
    const query = endpointOverride ?? DEFAULT_QUERY

    if (
      !force &&
      data.lastFetched &&
      data.lastQuery === query &&
      Date.now() - data.lastFetched < 60_000
    ) {
      return
    }

    set({
      data: {
        ...data,
        isLoading: true,
        error: undefined,
        lastQuery: query,
      },
    })

    try {
      const response = await fetch(`${SAROS_POOLS_ENDPOINT}?${query}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch Saros pools: ${response.status}`)
      }

      const payload = await response.json()

      const pools: SarosPoolOverview[] = Array.isArray(payload?.data?.data)
        ? payload.data.data.map((entry: any) => ({
          tokenX: {
            mintAddress: entry.tokenX?.mintAddress ?? '',
            name: entry.tokenX?.name ?? '',
            symbol: entry.tokenX?.symbol ?? '',
            decimals: Number(entry.tokenX?.decimals ?? 0),
            image: entry.tokenX?.image,
          },
          tokenY: {
            mintAddress: entry.tokenY?.mintAddress ?? '',
            name: entry.tokenY?.name ?? '',
            symbol: entry.tokenY?.symbol ?? '',
            decimals: Number(entry.tokenY?.decimals ?? 0),
            image: entry.tokenY?.image,
          },
          totalLiquidity: Number(entry.totalLiquidity ?? 0),
          volume24h: Number(entry.volume24h ?? 0),
          fees24h: Number(entry.fees24h ?? 0),
          apr24h: Number(entry.apr24h ?? 0),
          pairs: Array.isArray(entry.pairs)
            ? entry.pairs.map((pair: any) => ({
              pair: pair.pair,
              binStep: Number(pair.binStep ?? 0),
              activeBin: Number(pair.activeBin ?? 0),
              tokenX: {
                mintAddress: pair.tokenX?.mintAddress ?? '',
                name: pair.tokenX?.name ?? '',
                symbol: pair.tokenX?.symbol ?? '',
                decimals: Number(pair.tokenX?.decimals ?? 0),
                image: pair.tokenX?.image,
                address: pair.tokenX?.address,
              },
              tokenY: {
                mintAddress: pair.tokenY?.mintAddress ?? '',
                name: pair.tokenY?.name ?? '',
                symbol: pair.tokenY?.symbol ?? '',
                decimals: Number(pair.tokenY?.decimals ?? 0),
                image: pair.tokenY?.image,
                address: pair.tokenY?.address,
              },
              reserveX: String(pair.reserveX ?? '0'),
              reserveY: String(pair.reserveY ?? '0'),
              baseFactor: Number(pair.baseFactor ?? 0),
              totalLiquidity: Number(pair.totalLiquidity ?? 0),
              volume24h: Number(pair.volume24h ?? 0),
              fees24h: Number(pair.fees24h ?? 0),
              feesApr: Number(pair.feesApr ?? 0),
              rewardsApr: Number(pair.rewardsApr ?? 0),
              apr24h: Number(pair.apr24h ?? 0),
            }))
            : [],
        }))
        : []

      const matchedSelection = data.selectedPool
        ? pools.find((pool) =>
          pool.tokenX.mintAddress === data.selectedPool?.tokenX.mintAddress &&
          pool.tokenY.mintAddress === data.selectedPool?.tokenY.mintAddress
        ) ?? null
        : null

      set({
        data: {
          pools,
          isLoading: false,
          error: undefined,
          lastFetched: Date.now(),
          lastQuery: query,
          selectedPool: matchedSelection,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.warn('Saros data fetch failed. Verify connectivity to Saros public API.', error)
      set({
        data: {
          pools: [],
          isLoading: false,
          error: message,
          lastFetched: Date.now(),
          lastQuery: query,
          selectedPool: null,
        },
      })
    }
  },
}))
