import { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useDriftMarketsStore } from '../state'
import { createDriftWalletAdapter } from '../lib/driftWalletAdapter'
import {
  disposeDriftClient,
  driftClientIsReadOnly,
  getCurrentDriftWallet,
  getDriftClient,
  getDriftEnv,
} from '../services/driftClientService'
import { buildAllPerpMarketSnapshots, getPerpMarketIdentities } from '../services/marketDiscoveryService'

const SNAPSHOT_REFRESH_MS = 60_000

export const useDriftMarketDiscovery = () => {
  const wallet = useWallet()
  const env = getDriftEnv()

  const markets = useDriftMarketsStore((state) => state.markets)
  const setEnv = useDriftMarketsStore((state) => state.setEnv)
  const setMarkets = useDriftMarketsStore((state) => state.setMarkets)
  const setMarketStatus = useDriftMarketsStore((state) => state.setMarketStatus)
  const upsertSnapshot = useDriftMarketsStore((state) => state.upsertSnapshot)
  const resetSnapshots = useDriftMarketsStore((state) => state.resetSnapshots)

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const walletPublicKey = wallet.publicKey?.toBase58() ?? null

  useEffect(() => {
    setEnv(env)
    const identities = getPerpMarketIdentities(env)
    setMarkets(identities)
  }, [env, setEnv, setMarkets])

  useEffect(() => {
    const tearDownTimer = () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    if (markets.length === 0) {
      return () => tearDownTimer()
    }

    let cancelled = false

    const bootstrap = async () => {
      setMarketStatus('loading')
      try {
        const walletAdapter = wallet.connected && wallet.publicKey ? createDriftWalletAdapter(wallet) : undefined
        const client = await getDriftClient(walletAdapter)
        if (cancelled) {
          return
        }

        resetSnapshots()

        const refreshSnapshots = () => {
          const snapshots = buildAllPerpMarketSnapshots(
            client,
            markets.map((market) => market.marketIndex)
          )
          console.log('[Drift] Market snapshots:', snapshots.map(snapshot => ({
            marketIndex: snapshot.marketIndex,
            markPrice: snapshot.markPrice,
            change24hPct: snapshot.change24hPct,
            fundingRate24hPct: snapshot.fundingRate24hPct,
            openInterest: snapshot.openInterest,
            volume24h: snapshot.volume24h
          })))
          snapshots.forEach((snapshot) => upsertSnapshot(snapshot))
        }

        refreshSnapshots()
        tearDownTimer()
        refreshTimerRef.current = setInterval(refreshSnapshots, SNAPSHOT_REFRESH_MS)
        setMarketStatus('ready')
      } catch (error) {
        if (cancelled) {
          return
        }
        console.error('[Drift] failed to bootstrap market discovery', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        setMarketStatus('error', message)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      tearDownTimer()
    }
  }, [
    markets,
    wallet.connected,
    walletPublicKey,
    wallet.signTransaction,
    wallet.signAllTransactions,
    setMarketStatus,
    upsertSnapshot,
    resetSnapshots,
    wallet,
  ])

  useEffect(() => {
    return () => {
      const currentWallet = getCurrentDriftWallet()
      if (driftClientIsReadOnly() && currentWallet && !wallet.connected) {
        void disposeDriftClient()
      }
    }
  }, [wallet.connected])
}
