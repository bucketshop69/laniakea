// Vybe API Response Types

export interface VybeTokenBalance {
  symbol: string
  name: string
  mintAddress: string
  amount: string
  priceUsd: string
  priceUsd1dChange: string | null
  priceUsd7dTrend: string[]
  valueUsd: string
  valueUsd1dChange: string | null
  averagePriceUsd: string | null
  logoUrl: string
  category: string | null
  decimals: number
  verified: boolean
  slot: number
}

export interface VybeAccountBalanceResponse {
  date: number
  ownerAddress: string
  stakedSolBalanceUsd: string
  stakedSolBalance: string
  activeStakedSolBalanceUsd: string
  activeStakedSolBalance: string
  totalTokenValueUsd: string
  totalTokenValueUsd1dChange: string
  totalTokenCount: number
  data: VybeTokenBalance[]
}

// Simplified Profile Data for UI
export interface ProfileOverview {
  totalValue: number
  change24h: number
  changePercent24h: number
  tokenCount: number
  walletAddress: string
}

export interface ProfileState {
  overview: ProfileOverview | null
  isLoading: boolean
  error: string | null
  lastFetchTime: number | null
}
