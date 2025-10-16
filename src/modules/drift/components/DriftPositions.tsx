import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import DriftOrders from './DriftOrders'
import {
  cancelPerpOrderByUserId,
  getActivePerpPositionsDetails,
  type PerpOrderSummary,
  type PerpPositionDetails,
} from '../services/driftPositionService'
import { useDriftMarketsStore } from '../state'

type DriftPositionsProps = {
  marketIndex?: number | null
}

const formatCurrency = (
  value: number | null | undefined,
  { signed = false, decimals = 2 }: { signed?: boolean; decimals?: number } = {}
): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const places = abs >= 1 ? decimals : Math.min(4, decimals + 2)
  const prefix = signed && value > 0 ? '+' : ''
  return `${prefix}$${value.toFixed(places)}`
}

const formatNumber = (value: number | null | undefined, decimals = 4): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

const positionsPerPage = 3

const DriftPositions = ({ marketIndex }: DriftPositionsProps) => {
  const [positions, setPositions] = useState<PerpPositionDetails[]>([])
  const [page, setPage] = useState(0)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const snapshots = useDriftMarketsStore((s) => s.snapshots)
  const markets = useDriftMarketsStore((s) => s.markets)

  const marketMap = useMemo(() => {
    const map = new Map<number, { symbol: string; baseAssetSymbol: string }>()
    markets.forEach((m) => {
      map.set(m.marketIndex, { symbol: m.symbol, baseAssetSymbol: m.baseAssetSymbol })
    })
    return map
  }, [markets])

  const fetchPositions = useCallback(async () => {
    try {
      return await getActivePerpPositionsDetails()
    } catch (e) {
      console.error('[DriftPositions] failed to load positions', e)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const list = await fetchPositions()
      if (!cancelled && list) setPositions(list)
    }
    void run()
    const id = setInterval(run, 15_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fetchPositions])

  const filteredPositions = useMemo(() => {
    if (marketIndex == null) return positions
    return positions.filter((p) => p.marketIndex === marketIndex)
  }, [marketIndex, positions])

  const pageCount = Math.max(1, Math.ceil(filteredPositions.length / positionsPerPage))

  useEffect(() => {
    setPage(0)
  }, [marketIndex])

  useEffect(() => {
    const maxPage = pageCount - 1
    if (page > maxPage) {
      setPage(Math.max(0, maxPage))
    }
  }, [page, pageCount])

  const visiblePositions = filteredPositions.slice(
    page * positionsPerPage,
    page * positionsPerPage + positionsPerPage
  )

  const selectedPosition = useMemo(() => {
    if (selectedMarketIndex == null) return null
    return positions.find((p) => p.marketIndex === selectedMarketIndex) ?? null
  }, [positions, selectedMarketIndex])

  const selectedSymbol = selectedMarketIndex != null ? marketMap.get(selectedMarketIndex)?.symbol : undefined

  const handleCancelOrder = useCallback(
    async (order: PerpOrderSummary) => {
      if (cancellingOrderId !== null) return
      setCancellingOrderId(order.userOrderId)
      try {
        const txSig = await cancelPerpOrderByUserId(order.userOrderId)
        console.log('[DriftOrders] cancel submitted', { txSig, orderId: order.userOrderId })
        const list = await fetchPositions()
        if (list) setPositions(list)
      } catch (e) {
        console.error('[DriftOrders] failed to cancel order', e)
      } finally {
        setCancellingOrderId(null)
      }
    },
    [cancellingOrderId, fetchPositions]
  )

  if (filteredPositions.length === 0) {
    return <Card className="p-2 text-xs text-muted-foreground">No active positions</Card>
  }

  return (
    <div className="flex flex-col gap-2">
      {visiblePositions.map((position) => {
        const snapshot = snapshots[position.marketIndex]
        const market = marketMap.get(position.marketIndex)
        const markPrice = snapshot?.markPrice ?? null
        const pnl = position.unrealizedPnl ?? 0
        const funding = position.fundingPnl ?? 0
        const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
        const fundingClass = funding >= 0 ? 'text-emerald-400' : 'text-red-400'
        const notional = typeof markPrice === 'number' ? markPrice * position.baseSize : null

        return (
          <Card
            key={position.marketIndex}
            className={cn(
              'border px-1 py-1 text-xs shadow-sm',
              position.side === 'long'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-red-500/30 bg-red-500/5'
            )}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <span className="text-primary">{market?.symbol ?? `#${position.marketIndex}`}</span>
              <span
                className={cn(
                  'rounded px-1 py-px text-[10px] font-semibold uppercase',
                  position.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}
              >
                {position.side}
              </span>
              <div className="ml-auto flex items-center gap-1 text-[11px] font-normal text-muted-foreground">
                <span>Mark {formatCurrency(markPrice)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    setSelectedMarketIndex(position.marketIndex)
                    setOrdersOpen(true)
                  }}
                  disabled={position.orders.length === 0}
                >
                  Orders
                  <span className="ml-1 rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                    {position.orders.length}
                  </span>
                </Button>
                <Button size="sm" variant="outline" className="h-6 w-6 p-0" disabled>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 text-[11px] text-muted-foreground">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">Size</span>
                <span className="text-foreground">{formatNumber(position.baseSize)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">Entry</span>
                <span className="text-foreground">{formatCurrency(position.entryPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">PnL</span>
                <span className={cn('text-foreground', pnlClass)}>{formatCurrency(pnl, { signed: true })}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">Notional</span>
                <span className="text-foreground">{formatCurrency(notional)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">Liq</span>
                <span className="text-foreground">{formatCurrency(position.liquidationPrice)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[9px] uppercase tracking-wide">Funding</span>
                <span className={cn('text-foreground', fundingClass)}>{formatCurrency(funding, { signed: true })}</span>
              </div>
            </div>
          </Card>
        )
      })}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          {Array.from({ length: pageCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPage(idx)}
              className={cn(
                'mx-0.5 h-2 w-2 rounded-full transition-opacity',
                idx === page ? 'bg-foreground opacity-90' : 'bg-muted opacity-60 hover:opacity-80'
              )}
            />
          ))}
        </div>
      )}

      <DriftOrders
        open={ordersOpen}
        onOpenChange={(next) => {
          setOrdersOpen(next)
          if (!next) setSelectedMarketIndex(null)
        }}
        symbol={selectedSymbol}
        orders={selectedPosition?.orders ?? []}
        cancellingOrderId={cancellingOrderId}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  )
}

export default DriftPositions
