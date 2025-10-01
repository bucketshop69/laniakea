import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSarosBinDistribution, type SarosBinLiquidityPoint } from '../services/poolService'

type State = {
  data: SarosBinLiquidityPoint[]
  isLoading: boolean
  error: string | null
}

export const useFetchBinDistribution = (params?: {
  pairAddress?: string
  activeBin?: number
  binStep?: number
  baseDecimals?: number
  quoteDecimals?: number
  range?: number
}) => {
  const [state, setState] = useState<State>({ data: [], isLoading: false, error: null })
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!params?.pairAddress || params.activeBin == null || params.binStep == null || params.baseDecimals == null || params.quoteDecimals == null) {
      if (mountedRef.current) {
        setState({ data: [], isLoading: false, error: null })
      }
      return
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))
    }

    try {
      const data = await fetchSarosBinDistribution({
        pairAddress: params.pairAddress,
        activeBin: params.activeBin,
        binStep: params.binStep,
        baseDecimals: params.baseDecimals,
        quoteDecimals: params.quoteDecimals,
        range: params.range ?? 50,
      })

      if (mountedRef.current) {
        setState({ data, isLoading: false, error: null })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load bin distribution'
      if (mountedRef.current) {
        setState({ data: [], isLoading: false, error: message })
      }
    }
  }, [params])

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

export default useFetchBinDistribution
