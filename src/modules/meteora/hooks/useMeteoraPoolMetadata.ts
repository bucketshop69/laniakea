import { useEffect, useState, useRef, useCallback } from 'react'
import type { MeteoraPool } from '../types/domain'

interface MeteoraPoolSnapshot {
  address: string
  name: string
  price: number
  tvl: number
  volume24h: number
  apr: number
  apy: number
  farmApr: number
  farmApy: number
  feeTier: number
  priceChange24h: number | null
  reserveX: number
  reserveY: number
  baseSymbol: string
  quoteSymbol: string
}

interface State {
  snapshot: MeteoraPoolSnapshot | null
  isLoading: boolean
  error: string | null
}

interface Params {
  pool?: MeteoraPool | null
  enabled?: boolean
}

/**
 * Hook to get pool metadata snapshot from an already-loaded pool object.
 * For Meteora, we already have pool data from the store, so we just transform it.
 */
export const useMeteoraPoolMetadata = (params?: Params) => {
  const [state, setState] = useState<State>({ snapshot: null, isLoading: false, error: null })
  const mountedRef = useRef(true)
  
  const pool = params?.pool
  const enabled = params?.enabled ?? true

  const processPool = useCallback(() => {
    if (!enabled || !pool) {
      if (mountedRef.current) {
        setState({ snapshot: null, isLoading: false, error: null })
      }
      return
    }

    try {
      // Extract token symbols from pool name (e.g., "SOL-USDC")
      const nameParts = pool.name.split('-')
      const baseSymbol = nameParts[0] || 'BASE'
      const quoteSymbol = nameParts[1] || 'QUOTE'

      const snapshot: MeteoraPoolSnapshot = {
        address: pool.address,
        name: pool.name,
        price: pool.current_price,
        tvl: parseFloat(pool.liquidity),
        volume24h: pool.trade_volume_24h,
        apr: pool.apr,
        apy: pool.apy,
        farmApr: pool.farm_apr,
        farmApy: pool.farm_apy,
        feeTier: parseFloat(pool.base_fee_percentage),
        priceChange24h: null, // Not available in current API response
        reserveX: pool.reserve_x_amount,
        reserveY: pool.reserve_y_amount,
        baseSymbol,
        quoteSymbol,
      }

      if (mountedRef.current) {
        setState({
          snapshot,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process pool metadata'
      console.error('[Meteora] Pool metadata processing error:', error)
      if (mountedRef.current) {
        setState({ snapshot: null, isLoading: false, error: message })
      }
    }
  }, [enabled, pool])

  useEffect(() => {
    mountedRef.current = true
    processPool()
    return () => {
      mountedRef.current = false
    }
  }, [processPool])

  return {
    snapshot: state.snapshot,
    isLoading: state.isLoading,
    error: state.error,
  }
}

export default useMeteoraPoolMetadata
