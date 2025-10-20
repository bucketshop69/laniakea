import { useCallback, useMemo } from 'react'
import type { WalletTokenBalance } from '@/store/walletBalanceStore'
import type { MeteoraPool } from '../types/domain'

/**
 * Hook for formatting balances and displaying token symbols
 * Provides consistent formatting across the application
 */
export function useBalanceFormatters({
  pool,
  baseTokenBalance,
  quoteTokenBalance,
  connected,
  isBalanceLoading,
  balancesError,
}: {
  pool: MeteoraPool | null
  baseTokenBalance: WalletTokenBalance | undefined
  quoteTokenBalance: WalletTokenBalance | undefined
  connected: boolean
  isBalanceLoading: boolean
  balancesError: string | null | undefined
}) {
  // Format balance helpers
  const formatAvailable = useCallback((balance?: WalletTokenBalance) => {
    if (!balance) {
      return '0'
    }

    const amount = balance.uiAmount
    if (!Number.isFinite(amount) || Number.isNaN(amount)) {
      return balance.uiAmountString
    }

    if (amount === 0) {
      return '0'
    }

    if (amount >= 1) {
      return amount.toLocaleString(undefined, { maximumFractionDigits: 4 })
    }

    return amount.toLocaleString(undefined, { maximumSignificantDigits: 4 })
  }, [])

  const renderBalanceLabel = useCallback((balance: WalletTokenBalance | undefined, symbol: string) => {
    if (!connected) {
      return 'Connect wallet to view balance'
    }

    if (isBalanceLoading) {
      return 'Fetching balance…'
    }

    if (balancesError) {
      return 'Balance unavailable'
    }

    return `Available: ${formatAvailable(balance)} ${symbol}`
  }, [balancesError, connected, formatAvailable, isBalanceLoading])

  // Get token symbols from pool name (e.g., "SOL-USDC" -> ["SOL", "USDC"])
  const [baseSymbol, quoteSymbol] = useMemo(() => {
    if (!pool?.name) return ['TOKEN_X', 'TOKEN_Y']

    const tokens = pool.name.split('-').map(t => t.trim())
    if (tokens.length >= 2) {
      return [tokens[0], tokens[1]]
    }

    return ['TOKEN_X', 'TOKEN_Y']
  }, [pool?.name])

  // Balance labels
  const baseBalanceLabel = renderBalanceLabel(baseTokenBalance, baseSymbol)
  const quoteBalanceLabel = renderBalanceLabel(quoteTokenBalance, quoteSymbol)

  return {
    formatAvailable,
    baseSymbol,
    quoteSymbol,
    baseBalanceLabel,
    quoteBalanceLabel,
  }
}
