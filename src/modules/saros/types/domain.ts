import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import type { PublicKey } from '@solana/web3.js'

export interface SarosTokenMeta {
  mintAddress: string
  name: string
  symbol: string
  decimals: number
  image?: string
}

export interface SarosPoolPairSummary {
  pair: string
  binStep: number
  activeBin: number
  tokenX: SarosTokenMeta & { address?: string }
  tokenY: SarosTokenMeta & { address?: string }
  reserveX: string
  reserveY: string
  baseFactor: number
  totalLiquidity: number
  volume24h: number
  fees24h: number
  feesApr: number
  rewardsApr: number
  apr24h: number
}

export interface SarosPoolOverview {
  tokenX: SarosTokenMeta
  tokenY: SarosTokenMeta
  totalLiquidity: number
  volume24h: number
  fees24h: number
  apr24h: number
  pairs: SarosPoolPairSummary[]
}

export interface SarosTokenWithMarket extends SarosTokenMeta {
  address: string
  chain: string
  cgkId: string
  current_price: string
  marketInfo?: {
    current_price: string
  }
}

export interface SarosExistingPool {
  _id: string
  pair: string
  binStep: number
  binStepConfig: string
  tokenX: SarosTokenMeta & { mintAddress: string; address: string }
  tokenY: SarosTokenMeta & { mintAddress: string; address: string }
}

export interface SarosPoolMetadataSnapshot {
  raw: PoolMetadata
  poolAddress: string
  price: number | null
  baseReserve: number
  quoteReserve: number
  totalValueQuote: number | null
  baseDecimals: number
  quoteDecimals: number
}

export interface SarosPoolMetadataState {
  snapshot: SarosPoolMetadataSnapshot | null
  isLoading: boolean
  error: string | null
}

export interface SarosUserPosition {
  positionMint: string
  position: string
  lowerBinId: number
  upperBinId: number
  totalBins: number
  baseAmount: number
  quoteAmount: number
}

export interface SarosCreatePoolRequest {
  tokenBaseMint: string
  tokenBaseDecimals: number
  tokenQuoteMint: string
  tokenQuoteDecimals: number
  ratePrice: number
  binStep: number
  payer: PublicKey
}

export interface SarosTransactionContext {
  blockhash: string
  lastValidBlockHeight: number
}

export interface SarosOverviewChartPoint {
  date: string
  liquidity: number
  volume: number
  cumulativeVolume: number
}

export interface SarosBinLiquidityPoint {
  binId: number
  price: number
  reserveBase: number
  reserveQuote: number
  totalSupply: number
}
