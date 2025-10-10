import type { CandleResolution, DriftEnv } from '@drift-labs/sdk'

export type DriftMarketCategory = 'L1' | 'L2' | 'Infra' | 'Meme' | 'Exchange' | 'Oracle' | 'Data' | 'Prediction' | 'MEV' | 'Bridge' | 'Lending' | 'Solana' | 'Payments' | 'Dog' | 'IoT' | 'Rollup' | 'Default'

export interface DriftMarketIdentity {
  env: DriftEnv
  marketIndex: number
  symbol: string
  baseAssetSymbol: string
  fullName?: string
  categories: DriftMarketCategory[]
  oracleAddress: string
  oracleSource: string
}

export interface DriftMarketSnapshot {
  marketIndex: number
  markPrice?: number
  oraclePrice?: number
  bidPrice?: number
  askPrice?: number
  change24hPct?: number
  fundingRate24hPct?: number
  openInterest?: number
  volume24h?: number
  liquidityBids?: number
  liquidityAsks?: number
  insuranceAvailable?: number
  lastUpdatedTs: number
}

export interface DriftCandlePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface DriftChartState {
  resolution: CandleResolution
  data: DriftCandlePoint[]
  loading: boolean
  error: string | null
  lastFetchedTs: number | null
}

export interface DriftMarketsStateSlice {
  env: DriftEnv
  markets: DriftMarketIdentity[]
  marketStatus: 'idle' | 'loading' | 'ready' | 'error'
  marketError: string | null
  selectedMarketIndex: number | null
  snapshots: Record<number, DriftMarketSnapshot>
  chart: DriftChartState
}

export interface DriftMarketsActionsSlice {
  setEnv: (env: DriftEnv) => void
  setMarkets: (markets: DriftMarketIdentity[]) => void
  setMarketStatus: (status: DriftMarketsStateSlice['marketStatus'], error?: string | null) => void
  selectMarket: (marketIndex: number) => void
  upsertSnapshot: (snapshot: DriftMarketSnapshot) => void
  patchSnapshot: (
    marketIndex: number,
    patch: Partial<Omit<DriftMarketSnapshot, 'marketIndex'>>
  ) => void
  resetSnapshots: () => void
  setChartResolution: (resolution: CandleResolution) => void
  setChartData: (data: DriftCandlePoint[], lastFetchedTs: number) => void
  setChartLoading: (loading: boolean) => void
  setChartError: (error: string | null) => void
}

export type DriftMarketsStore = DriftMarketsStateSlice & DriftMarketsActionsSlice
