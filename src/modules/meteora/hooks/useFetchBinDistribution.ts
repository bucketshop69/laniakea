import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchMeteoraBinDistribution } from '../services/bins'
import type { MeteoraBinLiquidityPoint } from '../services/bins'

type State = {
  data: MeteoraBinLiquidityPoint[]
  activeBinId: number | null
  isLoading: boolean
  error: string | null
}

interface Params {
  poolAddress?: string
  activeBin?: number
  range?: number // Default 33 bins on each side (33 + 1 + 33 = 67 total)
  enabled?: boolean
}

export const useMeteoraBinDistribution = (params?: Params) => {
  const [state, setState] = useState<State>({ data: [], activeBinId: null, isLoading: false, error: null })
  const mountedRef = useRef(true)

  // Extract params to avoid recreating callback on every render
  const poolAddress = params?.poolAddress
  const activeBin = params?.activeBin
  const range = params?.range ?? 33 // Default to 33 bins on each side
  const enabled = params?.enabled

  const fetchData = useCallback(async () => {
    if (!enabled || !poolAddress || activeBin == null) {
      if (mountedRef.current) {
        setState({ data: [], activeBinId: null, isLoading: false, error: null })
      }
      return
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      console.log('[Meteora Hook] Fetching bin distribution')

      const result = await fetchMeteoraBinDistribution({
        poolAddress,
        activeBin,
        range,
      })

      if (mountedRef.current) {
        setState({
          data: result.bins,
          activeBinId: result.activeBinId,
          isLoading: false,
          error: null
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load bin distribution'
      console.error('[Meteora] Bin distribution fetch error:', error)
      if (mountedRef.current) {
        setState({ data: [], activeBinId: null, isLoading: false, error: message })
      }
    }
  }, [enabled, poolAddress, activeBin, range])

  useEffect(() => {
    mountedRef.current = true
    void fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  const paramsKey = useMemo(() => ({
    poolAddress: params?.poolAddress,
    activeBin: params?.activeBin,
    range: params?.range,
  }), [params?.poolAddress, params?.activeBin, params?.range])

  return {
    data: state.data,
    activeBinId: state.activeBinId,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
    paramsKey,
  }
}

export default useMeteoraBinDistribution
