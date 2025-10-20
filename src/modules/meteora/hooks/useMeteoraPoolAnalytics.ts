import { useEffect, useState, useCallback, useRef } from 'react'
import {
  fetchPoolFeeBps,
  fetchPoolVolume,
  type MeteoraFeeBpsPoint,
  type MeteoraVolumePoint,
} from '../services/analytics'

interface State {
  feeBps: MeteoraFeeBpsPoint[]
  volume: MeteoraVolumePoint[]
  isLoading: boolean
  error: string | null
}

interface Params {
  poolAddress?: string
  enabled?: boolean
  feeDays?: number
  volumeDays?: number
}

export const useMeteoraPoolAnalytics = (params?: Params) => {
  const [state, setState] = useState<State>({
    feeBps: [],
    volume: [],
    isLoading: false,
    error: null,
  })
  const mountedRef = useRef(true)

  const poolAddress = params?.poolAddress
  const enabled = params?.enabled ?? true
  const feeDays = params?.feeDays ?? 1
  const volumeDays = params?.volumeDays ?? 7

  const fetchData = useCallback(async () => {
    if (!enabled || !poolAddress) {
      if (mountedRef.current) {
        setState({ feeBps: [], volume: [], isLoading: false, error: null })
      }
      return
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      console.log('[Meteora Hook] Fetching pool analytics for', poolAddress, { feeDays, volumeDays })

      // Fetch fee and volume data in parallel
      const [feeBpsData, volumeData] = await Promise.all([
        fetchPoolFeeBps(poolAddress, feeDays),
        fetchPoolVolume(poolAddress, volumeDays),
      ])

      if (mountedRef.current) {
        setState({
          feeBps: feeBpsData,
          volume: volumeData,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load pool analytics'
      console.error('[Meteora] Pool analytics fetch error:', error)
      if (mountedRef.current) {
        setState({ feeBps: [], volume: [], isLoading: false, error: message })
      }
    }
  }, [enabled, poolAddress, feeDays, volumeDays])

  useEffect(() => {
    mountedRef.current = true
    void fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  return {
    feeBps: state.feeBps,
    volume: state.volume,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
  }
}

export default useMeteoraPoolAnalytics
