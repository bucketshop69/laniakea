import { type ReactNode, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletBalanceStore } from '@/store/walletBalanceStore'
import { getSolanaConnection } from '@/lib/solanaConnection'

interface WalletBalanceProviderProps {
  children: ReactNode
}

export const WalletBalanceProvider = ({ children }: WalletBalanceProviderProps) => {
  const connection = getSolanaConnection()
  const { publicKey, connected } = useWallet()
  const fetchBalances = useWalletBalanceStore((state) => state.fetchBalances)
  const reset = useWalletBalanceStore((state) => state.reset)

  useEffect(() => {
    if (connected && publicKey) {
      void fetchBalances(connection, publicKey, { force: true })
      return
    }

    reset()
  }, [connected, publicKey, connection, fetchBalances, reset])

  return <>{children}</>
}

export default WalletBalanceProvider
