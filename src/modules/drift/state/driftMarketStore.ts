import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { DriftMarketsStore, DriftMarketIdentity, DriftMarketSnapshot, DriftCandlePoint } from '../types'
import type { CandleResolution, DriftEnv } from '@drift-labs/sdk'

const DEFAULT_ENV: DriftEnv = 'mainnet-beta'
const DEFAULT_RESOLUTION: CandleResolution = '60'

export const useDriftMarketsStore = create<DriftMarketsStore>()(
  devtools((set) => ({
    env: DEFAULT_ENV,
    markets: [],
    marketStatus: 'idle',
    marketError: null,
    selectedMarketIndex: null,
    snapshots: {},
    chart: {
      resolution: DEFAULT_RESOLUTION,
      data: [],
      loading: false,
      error: null,
      lastFetchedTs: null,
    },
    setEnv: (env) => set({ env }),
    setMarkets: (markets: DriftMarketIdentity[]) =>
      set((state) => ({
        markets,
        selectedMarketIndex:
          state.selectedMarketIndex !== null && markets.some((market) => market.marketIndex === state.selectedMarketIndex)
            ? state.selectedMarketIndex
            : markets[0]?.marketIndex ?? null,
      })),
    setMarketStatus: (status, error = null) =>
      set({
        marketStatus: status,
        marketError: error ?? null,
      }),
    selectMarket: (marketIndex) => set({ selectedMarketIndex: marketIndex }),
    upsertSnapshot: (snapshot: DriftMarketSnapshot) =>
      set((state) => ({
        snapshots: {
          ...state.snapshots,
          [snapshot.marketIndex]: snapshot,
        },
      })),
    patchSnapshot: (marketIndex, patch) =>
      set((state) => {
        const existing = state.snapshots[marketIndex]
        const fallback: DriftMarketSnapshot = existing ?? {
          marketIndex,
          lastUpdatedTs: Date.now(),
        }
        const next: DriftMarketSnapshot = {
          ...fallback,
          ...patch,
          marketIndex,
          lastUpdatedTs: patch.lastUpdatedTs ?? Date.now(),
        }

        return {
          snapshots: {
            ...state.snapshots,
            [marketIndex]: next,
          },
        }
      }),
    resetSnapshots: () => set({ snapshots: {} }),
    setChartResolution: (resolution) =>
      set((state) => ({
        chart: {
          ...state.chart,
          resolution,
        },
      })),
    setChartData: (data: DriftCandlePoint[], lastFetchedTs: number) =>
      set((state) => ({
        chart: {
          ...state.chart,
          data,
          lastFetchedTs,
        },
      })),
    setChartLoading: (loading: boolean) =>
      set((state) => ({
        chart: {
          ...state.chart,
          loading,
        },
      })),
    setChartError: (error: string | null) =>
      set((state) => ({
        chart: {
          ...state.chart,
          error,
        },
      })),
  }))
)
