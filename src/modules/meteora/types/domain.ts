// Meteora DLMM API Types

export interface MeteoraPairGroup {
  lexical_order_mints: string
  group_name: string
  token_x: string
  token_y: string
  pool_count: number
  total_tvl: number
  total_volume: number
  max_fee_tvl_ratio: number
  max_farm_apy: number
}

export interface MeteoraPairGroupsResponse {
  total: number
  pages: number
  current_page: number
  page_size: number
  data: MeteoraPairGroup[]
}

export interface MeteoraPoolFees {
  min_30: number
  hour_1: number
  hour_2: number
  hour_4: number
  hour_12: number
  hour_24: number
}

export interface MeteoraPoolFeeTvlRatio {
  min_30: number
  hour_1: number
  hour_2: number
  hour_4: number
  hour_12: number
  hour_24: number
}

export interface MeteoraPoolVolume {
  min_30: number
  hour_1: number
  hour_2: number
  hour_4: number
  hour_12: number
  hour_24: number
}

export interface MeteoraPool {
  address: string
  name: string
  mint_x: string
  mint_y: string
  reserve_x: string
  reserve_y: string
  reserve_x_amount: number
  reserve_y_amount: number
  bin_step: number
  base_fee_percentage: string
  max_fee_percentage: string
  protocol_fee_percentage: string
  liquidity: string
  reward_mint_x: string
  reward_mint_y: string
  fees_24h: number
  today_fees: number
  trade_volume_24h: number
  cumulative_trade_volume: string
  cumulative_fee_volume: string
  current_price: number
  apr: number
  apy: number
  farm_apr: number
  farm_apy: number
  hide: boolean
  is_blacklisted: boolean
  fees: MeteoraPoolFees
  fee_tvl_ratio: MeteoraPoolFeeTvlRatio
  volume: MeteoraPoolVolume
  tags: string[]
  launchpad: string | null
  is_verified: boolean
}

export interface MeteoraPoolsResponse {
  total: number
  pages: number
  current_page: number
  page_size: number
  data: MeteoraPool[]
}

// View types for UI state
export type MeteoraView = 'discover' | 'manage' | 'profile'
