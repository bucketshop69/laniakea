import { useEffect, useRef } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useDriftMarketsStore, useDriftSessionStore } from '../state'
import { createDriftWalletAdapter } from '../lib/driftWalletAdapter'
import {
  disposeDriftClient,
  driftClientIsReadOnly,
  getCurrentDriftWallet,
  getDriftClient,
  getDriftEnv,
} from '../services/driftClientService'
import { buildAllPerpMarketSnapshots, getPerpMarketIdentities } from '../services/marketDiscoveryService'
import { dlobWebsocketService, type DlobOrderbookEvent } from '../services/dlobWebsocketService'
import type { DriftMarketSnapshot } from '../types'

const SNAPSHOT_REFRESH_MS = 60_000

const SUBSCRIPTION_RESYNC_DELAY_MS = 2_000
const PRICE_SCALE = 1_000_000

export const useDriftMarketDiscovery = () => {
  const wallet = useWallet()
  const env = getDriftEnv()

  const markets = useDriftMarketsStore((state) => state.markets)
  const setEnv = useDriftMarketsStore((state) => state.setEnv)
  const setMarkets = useDriftMarketsStore((state) => state.setMarkets)
  const setMarketStatus = useDriftMarketsStore((state) => state.setMarketStatus)
  const upsertSnapshot = useDriftMarketsStore((state) => state.upsertSnapshot)
  const patchSnapshot = useDriftMarketsStore((state) => state.patchSnapshot)
  const resetSnapshots = useDriftMarketsStore((state) => state.resetSnapshots)
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex)

  const setClientReady = useDriftSessionStore((state) => state.setClientReady)
  const setReadOnly = useDriftSessionStore((state) => state.setReadOnly)
  const setClientError = useDriftSessionStore((state) => state.setClientError)
  const resetSession = useDriftSessionStore((state) => state.resetSession)

  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const walletPublicKey = wallet.publicKey?.toBase58() ?? null
  const refreshSnapshotsRef = useRef<(() => void) | null>(null)

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
      setClientError(null)
      setClientReady(false)
      try {
        const walletAdapter = wallet.connected && wallet.publicKey ? createDriftWalletAdapter(wallet) : undefined
        const client = await getDriftClient(walletAdapter)
        if (cancelled) {
          return
        }

        setReadOnly(driftClientIsReadOnly())
        setClientReady(true)
        setClientError(null)

        resetSnapshots()

        const refreshSnapshots = () => {
          const snapshots = buildAllPerpMarketSnapshots(
            client,
            markets.map((market) => market.marketIndex)
          )
          snapshots.forEach((snapshot) => upsertSnapshot(snapshot))
        }

        refreshSnapshotsRef.current = refreshSnapshots

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
        setClientError(message)
        setClientReady(false)
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
      tearDownTimer()
      refreshSnapshotsRef.current = null
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
    if (markets.length === 0) {
      return
    }

    dlobWebsocketService.setEnv(env)

    const subscriptions: Array<() => void> = []
    let shouldResync = false
    let resyncTimer: ReturnType<typeof setTimeout> | null = null

    const scheduleResync = () => {
      if (resyncTimer) {
        return
      }
      resyncTimer = setTimeout(() => {
        resyncTimer = null
        refreshSnapshotsRef.current?.()
      }, SUBSCRIPTION_RESYNC_DELAY_MS)
    }

    const toPriceNumber = (value: unknown): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.length === 0) {
          return undefined
        }
        if (trimmed.includes('.')) {
          const parsed = Number(trimmed)
          return Number.isFinite(parsed) ? parsed : undefined
        }
        const parsed = Number(trimmed)
        if (!Number.isFinite(parsed)) {
          return undefined
        }
        const scaled = parsed / PRICE_SCALE
        return Number.isFinite(scaled) ? scaled : undefined
      }
      return undefined
    }

    const getTopOfBook = (levels: unknown): number | undefined => {
      if (!Array.isArray(levels) || levels.length === 0) {
        return undefined
      }
      const level = levels[0]
      if (!level || typeof level !== 'object') {
        return undefined
      }
      const price = (level as { price?: unknown }).price
      return toPriceNumber(price)
    }

    const handleOrderbook = (marketIndex: number) => (event: DlobOrderbookEvent) => {
      const bidsPrice = getTopOfBook(event.payload?.bids)
      const asksPrice = getTopOfBook(event.payload?.asks)
      const oraclePrice = toPriceNumber(event.payload?.oracle)
        ?? toPriceNumber(event.payload?.oracleData?.price)

      const patch: Partial<Omit<DriftMarketSnapshot, 'marketIndex'>> & {
        lastUpdatedTs: number
      } = {
        lastUpdatedTs: event.receivedTs,
      }

      if (typeof bidsPrice === 'number') {
        patch.bidPrice = bidsPrice
      }
      if (typeof asksPrice === 'number') {
        patch.askPrice = asksPrice
      }
      if (typeof oraclePrice === 'number') {
        patch.oraclePrice = oraclePrice
      }

      if (typeof bidsPrice === 'number' && typeof asksPrice === 'number') {
        patch.markPrice = (bidsPrice + asksPrice) / 2
      } else if (typeof oraclePrice === 'number') {
        patch.markPrice = oraclePrice
      } else if (typeof bidsPrice === 'number') {
        patch.markPrice = bidsPrice
      } else if (typeof asksPrice === 'number') {
        patch.markPrice = asksPrice
      }

      patchSnapshot(marketIndex, patch)
    }

    if (selectedMarketIndex !== null) {
      const selected = markets.find((m) => m.marketIndex === selectedMarketIndex)
      if (selected) {
        const unsubscribe = dlobWebsocketService.subscribeOrderbook({
          market: selected.symbol,
          marketType: 'perp',
          handler: handleOrderbook(selected.marketIndex),
        })
        subscriptions.push(unsubscribe)
      }
    }

    const connectionUnsubscribe = dlobWebsocketService.onConnection((event) => {
      if (event.state === 'reconnecting') {
        shouldResync = true
      }
      if (event.state === 'connected' && shouldResync) {
        shouldResync = false
        scheduleResync()
      }
    })

    subscriptions.push(connectionUnsubscribe)

    return () => {
      if (resyncTimer) {
        clearTimeout(resyncTimer)
        resyncTimer = null
      }
      subscriptions.forEach((dispose) => {
        try {
          dispose()
        } catch (error) {
          console.error('[Drift] failed to dispose DLOB subscription', error)
        }
      })
    }
  }, [env, markets, patchSnapshot, selectedMarketIndex])

  useEffect(() => {
    return () => {
      const currentWallet = getCurrentDriftWallet()
      if (driftClientIsReadOnly() && currentWallet && !wallet.connected) {
        void disposeDriftClient()
      }
    }
  }, [wallet.connected])

  useEffect(() => {
    if (!wallet.connected) {
      resetSession()
    }
  }, [wallet.connected, resetSession])
}
