const METEORA_BASE_URL = 'https://dlmm-api.meteora.ag'

export interface MeteoraProtocolMetrics {
  total_tvl: number
  daily_trade_volume: number
  total_trade_volume: number
  daily_fee: number
  total_fee: number
}

/**
 * Fetch Meteora protocol-level aggregated metrics
 */
export async function fetchProtocolMetrics(): Promise<MeteoraProtocolMetrics> {
  const url = `${METEORA_BASE_URL}/info/protocol_metrics`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Protocol metrics fetch failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as MeteoraProtocolMetrics
  } catch (error) {
    console.error('[Meteora Analytics] Failed to fetch protocol metrics:', error)
    throw error
  }
}

/**
 * Fee BPS data point (hourly)
 */
export interface MeteoraFeeBpsPoint {
  pair_address: string
  min_fee_bps: number
  max_fee_bps: number
  average_fee_bps: number
  hour_date: string // ISO 8601 timestamp
}

/**
 * Fetch fee BPS analytics (hourly data)
 */
export async function fetchPoolFeeBps(
  poolAddress: string,
  numOfDays: number = 1
): Promise<MeteoraFeeBpsPoint[]> {
  const url = `${METEORA_BASE_URL}/pair/${poolAddress}/analytic/pair_fee_bps?num_of_days=${numOfDays}`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Fee BPS fetch failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as MeteoraFeeBpsPoint[]
  } catch (error) {
    console.error('[Meteora Analytics] Failed to fetch fee BPS:', error)
    throw error
  }
}

/**
 * Volume data point (daily)
 */
export interface MeteoraVolumePoint {
  pair_address: string
  trade_volume: number
  fee_volume: number
  protocol_fee_volume: number
  day_date: string // YYYY-MM-DD
}

/**
 * Fetch trade volume analytics (daily data)
 */
export async function fetchPoolVolume(
  poolAddress: string,
  numOfDays: number = 7
): Promise<MeteoraVolumePoint[]> {
  const url = `${METEORA_BASE_URL}/pair/${poolAddress}/analytic/pair_trade_volume?num_of_days=${numOfDays}`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Volume fetch failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as MeteoraVolumePoint[]
  } catch (error) {
    console.error('[Meteora Analytics] Failed to fetch volume:', error)
    throw error
  }
}

/**
 * Swap history record
 */
export interface MeteoraSwapRecord {
  tx_id: string
  in_amount: number
  in_amount_usd: number
  out_amount: number
  out_amount_usd: number
  trade_fee: number
  trade_fee_usd: number
  protocol_fee: number
  protocol_fee_usd: number
  onchain_timestamp: number
  pair_address: string
  start_bin_id: number
  end_bin_id: number
  bin_count: number
  fee_bps: number
  in_token: string
  out_token: string
}

/**
 * Fetch recent swap history
 */
export async function fetchSwapHistory(
  poolAddress: string,
  rowsToTake: number = 10
): Promise<MeteoraSwapRecord[]> {
  const url = `${METEORA_BASE_URL}/pair/${poolAddress}/analytic/swap_history?rows_to_take=${rowsToTake}`

  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Swap history fetch failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as MeteoraSwapRecord[]
  } catch (error) {
    console.error('[Meteora Analytics] Failed to fetch swap history:', error)
    throw error
  }
}
