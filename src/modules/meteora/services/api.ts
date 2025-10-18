import type { MeteoraPairGroupsResponse, MeteoraPoolsResponse } from '../types/domain'

const METEORA_API_BASE = 'https://dlmm-api.meteora.ag'

export interface FetchPairGroupsParams {
  page?: number
  per_page?: number
  sort_by?: string
  filter_by?: string
  fee_tvl_ratio_tw?: string
  volume_tw?: string
}

export interface FetchPairGroupPoolsParams {
  page?: number
  per_page?: number
  sort_by?: string
  filter_by?: string
  fee_tvl_ratio_tw?: string
  volume_tw?: string
}

/**
 * Fetch all pair groups (token pairs with multiple pools)
 */
export async function fetchPairGroups(
  params: FetchPairGroupsParams = {}
): Promise<MeteoraPairGroupsResponse> {
  const defaultParams: FetchPairGroupsParams = {
    page: 1,
    per_page: 20,
    sort_by: 'volume_24h:desc',
    filter_by: 'is_blacklisted:=false',
    fee_tvl_ratio_tw: 'fee_tvl_ratio_24h',
    volume_tw: 'volume_24h',
    ...params,
  }

  const queryParams = new URLSearchParams(
    Object.entries(defaultParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value)
        }
        return acc
      },
      {} as Record<string, string>
    )
  )

  const url = `${METEORA_API_BASE}/pair/groups?${queryParams}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch pair groups: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch all pools for a specific pair group
 * @param tokenPair - The lexical_order_mints value (e.g., "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v-So11111111111111111111111111111111111111112")
 */
export async function fetchPairGroupPools(
  tokenPair: string,
  params: FetchPairGroupPoolsParams = {}
): Promise<MeteoraPoolsResponse> {
  const defaultParams: FetchPairGroupPoolsParams = {
    page: 1,
    per_page: 4,
    sort_by: 'volume_24h:desc',
    filter_by: 'is_blacklisted:=false',
    fee_tvl_ratio_tw: 'fee_tvl_ratio_24h',
    volume_tw: 'volume_24h',
    ...params,
  }

  const queryParams = new URLSearchParams(
    Object.entries(defaultParams).reduce(
      (acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value)
        }
        return acc
      },
      {} as Record<string, string>
    )
  )

  const url = `${METEORA_API_BASE}/pair/groups/${tokenPair}?${queryParams}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch pools for pair ${tokenPair}: ${response.statusText}`)
  }

  return response.json()
}
