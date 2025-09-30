import { useCallback, useEffect, useRef, useState } from 'react'
import type { PoolMetadata } from '@saros-finance/dlmm-sdk/types/config'
import { fetchSarosPoolMetadata } from '../services/poolService'

type FetchState = {
  metadata: PoolMetadata | null
  price: string | null
  baseAmount: number | null
  quoteAmount: number | null
  totalValueQuote: number | null
  isLoading: boolean
  error: string | null
}

export const useFetchPoolMetadata = (poolAddress?: string) => {
  const [state, setState] = useState<FetchState>({
    metadata: null,
    price: null,
    baseAmount: null,
    quoteAmount: null,
    totalValueQuote: null,
    isLoading: false,
    error: null,
  })
  const mountedRef = useRef(true)

  const fetchMetadata = useCallback(
    async (address?: string) => {
      const target = address ?? poolAddress
      if (!target) {
        if (!mountedRef.current) {
          return null
        }
        setState({
          metadata: null,
          price: null,
          baseAmount: null,
          quoteAmount: null,
          totalValueQuote: null,
          isLoading: false,
          error: null,
        })
        return null
      }

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
      }

      try {
        const response = await fetchSarosPoolMetadata(target)
        let price: string | null = null

        const baseAmountValue = Number(response.baseReserve) / Math.pow(10, response.extra.tokenBaseDecimal)
        const quoteAmountValue = Number(response.quoteReserve) / Math.pow(10, response.extra.tokenQuoteDecimal)
        if (Number.isFinite(baseAmountValue) && baseAmountValue > 0) {
          price = (quoteAmountValue / baseAmountValue).toString()
        }
        const totalValueQuote = price ? baseAmountValue * Number(price) + quoteAmountValue : null

        if (mountedRef.current) {
          setState({
            metadata: response,
            price,
            baseAmount: baseAmountValue,
            quoteAmount: quoteAmountValue,
            totalValueQuote,
            isLoading: false,
            error: null,
          })
        }
        return response
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load pool metadata'
        if (mountedRef.current) {
          setState({
            metadata: null,
            price: null,
            baseAmount: null,
            quoteAmount: null,
            totalValueQuote: null,
            isLoading: false,
            error: message,
          })
        }
        return null
      }
    },
    [poolAddress]
  )

  useEffect(() => {
    mountedRef.current = true
    if (!poolAddress) {
      setState({
        metadata: null,
        price: null,
        baseAmount: null,
        quoteAmount: null,
        totalValueQuote: null,
        isLoading: false,
        error: null,
      })
    } else {
      void fetchMetadata(poolAddress)
    }

    return () => {
      mountedRef.current = false
    }
  }, [poolAddress, fetchMetadata])

  return {
    metadata: state.metadata,
    price: state.price,
    baseAmount: state.baseAmount,
    quoteAmount: state.quoteAmount,
    totalValueQuote: state.totalValueQuote,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchMetadata,
  }
}

export default useFetchPoolMetadata
