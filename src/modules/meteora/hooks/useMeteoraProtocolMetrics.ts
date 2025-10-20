import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchProtocolMetrics, type MeteoraProtocolMetrics } from '../services/analytics'

interface State {
  data: MeteoraProtocolMetrics | null
  isLoading: boolean
  error: string | null
}

interface Params {
  enabled?: boolean
}

export const useMeteoraProtocolMetrics = (params?: Params) => {
  const [state, setState] = useState<State>({ data: null, isLoading: false, error: null })
  const mountedRef = useRef(true)
  const enabled = params?.enabled ?? true

  const fetchData = useCallback(async () => {
    if (!enabled) {
      if (mountedRef.current) {
        setState({ data: null, isLoading: false, error: null })
      }
      return
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      console.log('[Meteora Hook] Fetching protocol metrics')

      const result = await fetchProtocolMetrics()

      if (mountedRef.current) {
        setState({
          data: result,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load protocol metrics'
      console.error('[Meteora] Protocol metrics fetch error:', error)
      if (mountedRef.current) {
        setState({ data: null, isLoading: false, error: message })
      }
    }
  }, [enabled])

  useEffect(() => {
    mountedRef.current = true
    void fetchData()
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
  }
}

export default useMeteoraProtocolMetrics
