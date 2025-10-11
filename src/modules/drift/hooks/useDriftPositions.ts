import { useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useDriftSessionStore, useDriftMarketsStore } from '../state'
import { useDriftPositionsStore } from '../state/driftPositionsStore'
import { checkUserExists, getAccountMetrics } from '../services/driftPositionService'

export const useDriftPositions = () => {
  const wallet = useWallet()
  const clientReady = useDriftSessionStore((s) => s.clientReady)
  const readOnly = useDriftSessionStore((s) => s.readOnly)

  const setUserExists = useDriftPositionsStore((s) => s.setUserExists)
  const setUserReady = useDriftPositionsStore((s) => s.setUserReady)
  const setUserError = useDriftPositionsStore((s) => s.setUserError)
  const setUserAccountPubkey = useDriftPositionsStore((s) => s.setUserAccountPubkey)
  const setMetrics = useDriftPositionsStore((s) => s.setMetrics)
  const reset = useDriftPositionsStore((s) => s.reset)
  const selectedMarketIndex = useDriftMarketsStore((s) => s.selectedMarketIndex)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setUserError(null)
      setUserExists(null)
      setUserReady(false)
      setUserAccountPubkey(null)

      if (!wallet.connected || !wallet.publicKey || !clientReady || readOnly) {
        return
      }

      try {
        const { exists, userAccount } = await checkUserExists(wallet.publicKey)
        if (cancelled) return
        setUserExists(exists)
        if (exists) {
          setUserAccountPubkey(userAccount ? userAccount.toBase58() : null)
          setUserReady(true)
          const metrics = await getAccountMetrics(typeof selectedMarketIndex === 'number' ? selectedMarketIndex : undefined)
          if (!cancelled) setMetrics(metrics)
        } else {
          setUserReady(false)
        }
      } catch (error) {
        if (cancelled) return
        const msg = error instanceof Error ? error.message : 'Failed to load Drift user'
        setUserError(msg)
        setUserReady(false)
      }
    }

    void run()
    return () => {
      cancelled = true
      if (!wallet.connected) {
        reset()
      }
    }
  }, [wallet.connected, wallet.publicKey, clientReady, readOnly, setUserAccountPubkey, setUserError, setUserExists, setUserReady, reset])

  // Refresh buying power on market switch
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!wallet.connected || !wallet.publicKey || !clientReady || readOnly) return
      try {
        const metrics = await getAccountMetrics(typeof selectedMarketIndex === 'number' ? selectedMarketIndex : undefined)
        if (!cancelled) setMetrics(metrics)
      } catch {}
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [selectedMarketIndex, wallet.connected, wallet.publicKey, clientReady, readOnly, setMetrics])
}
