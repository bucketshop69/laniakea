import { useMemo, useRef } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useWalletBalanceStore, type WalletTokenBalance } from '@/store/walletBalanceStore'

const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112'

/**
 * Hook to get token balances for base and quote tokens
 * Handles native SOL specially and maintains object identity to prevent re-renders
 */
export function useWalletBalances({
  baseMint,
  quoteMint,
  publicKey,
}: {
  baseMint: string
  quoteMint: string
  publicKey: PublicKey | null
}) {
  const nativeBalanceSol = useWalletBalanceStore((state) => state.nativeBalanceSol)
  const nativeBalanceLamports = useWalletBalanceStore((state) => state.nativeBalanceLamports)
  const balancesByMint = useWalletBalanceStore((state) => state.balancesByMint)

  // Use refs to maintain object identity and prevent unnecessary re-renders
  const baseTokenBalanceRef = useRef<WalletTokenBalance | undefined>(undefined)
  const quoteTokenBalanceRef = useRef<WalletTokenBalance | undefined>(undefined)

  // Get balances, handling native SOL specially
  const baseTokenBalance = useMemo(() => {
    if (baseMint === NATIVE_SOL_MINT) {
      // Return native SOL as a WalletTokenBalance-like object
      const newBalance = {
        account: '',
        mint: NATIVE_SOL_MINT,
        owner: publicKey?.toString() ?? '',
        amountRaw: nativeBalanceLamports.toString(),
        decimals: 9,
        uiAmount: nativeBalanceSol,
        uiAmountString: nativeBalanceSol.toString(),
        isNative: true,
      }

      // Only create new object if values changed
      if (!baseTokenBalanceRef.current ||
        baseTokenBalanceRef.current.uiAmount !== nativeBalanceSol ||
        baseTokenBalanceRef.current.amountRaw !== nativeBalanceLamports.toString()) {
        baseTokenBalanceRef.current = newBalance
      }

      return baseTokenBalanceRef.current
    }

    const tokenBalance = baseMint ? balancesByMint[baseMint] : undefined
    baseTokenBalanceRef.current = tokenBalance
    return tokenBalance
  }, [baseMint, nativeBalanceSol, nativeBalanceLamports, balancesByMint, publicKey])

  const quoteTokenBalance = useMemo(() => {
    if (quoteMint === NATIVE_SOL_MINT) {
      // Return native SOL as a WalletTokenBalance-like object
      const newBalance = {
        account: '',
        mint: NATIVE_SOL_MINT,
        owner: publicKey?.toString() ?? '',
        amountRaw: nativeBalanceLamports.toString(),
        decimals: 9,
        uiAmount: nativeBalanceSol,
        uiAmountString: nativeBalanceSol.toString(),
        isNative: true,
      }

      // Only create new object if values changed
      if (!quoteTokenBalanceRef.current ||
        quoteTokenBalanceRef.current.uiAmount !== nativeBalanceSol ||
        quoteTokenBalanceRef.current.amountRaw !== nativeBalanceLamports.toString()) {
        quoteTokenBalanceRef.current = newBalance
      }

      return quoteTokenBalanceRef.current
    }

    const tokenBalance = quoteMint ? balancesByMint[quoteMint] : undefined
    quoteTokenBalanceRef.current = tokenBalance
    return tokenBalance
  }, [quoteMint, nativeBalanceSol, nativeBalanceLamports, balancesByMint, publicKey])

  return {
    baseTokenBalance,
    quoteTokenBalance,
  }
}
