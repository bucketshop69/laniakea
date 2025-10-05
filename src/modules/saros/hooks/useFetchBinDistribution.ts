import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchSarosBinDistribution } from '../services/pools'
import type { SarosBinLiquidityPoint } from '../types/domain'

type State = {
  data: SarosBinLiquidityPoint[]
  isLoading: boolean
  error: string | null
}

interface Params {
  pairAddress?: string
  activeBin?: number
  binStep?: number
  baseDecimals?: number
  quoteDecimals?: number
  range?: number
  enabled?: boolean
}

export const useSarosBinDistribution = (params?: Params) => {
  const [state, setState] = useState<State>({ data: [], isLoading: false, error: null })
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (
      !params?.enabled ||
      !params?.pairAddress ||
      params.activeBin == null ||
      params.binStep == null ||
      params.baseDecimals == null ||
      params.quoteDecimals == null
    ) {
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

  const paramsKey = useMemo(() => ({
    pairAddress: params?.pairAddress,
    activeBin: params?.activeBin,
    binStep: params?.binStep,
    baseDecimals: params?.baseDecimals,
    quoteDecimals: params?.quoteDecimals,
    range: params?.range,
  }), [params?.pairAddress, params?.activeBin, params?.binStep, params?.baseDecimals, params?.quoteDecimals, params?.range])

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchData,
    paramsKey,
  }
}

export default useSarosBinDistribution
