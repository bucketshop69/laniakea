import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, AlertTriangle } from 'lucide-react'
import DriftOrders from './DriftOrders'
import {
  cancelPerpOrderByUserId,
  closePerpPosition,
  getActivePerpPositionsDetails,
  type PerpOrderSummary,
  type PerpPositionDetails,
} from '../services/driftPositionService'
import { useDriftMarketsStore } from '../state'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

let toastIdCounter = 0
const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = toastIdCounter++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  return { toasts, showToast }
}

const ToastContainer = ({ toasts }: { toasts: Toast[] }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm shadow-lg',
            toast.type === 'success' && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
            toast.type === 'error' && 'border-red-500/50 bg-red-500/10 text-red-400',
            toast.type === 'info' && 'border-blue-500/50 bg-blue-500/10 text-blue-400'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

type ConfirmCloseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  position: PerpPositionDetails | null
  symbol?: string
  markPrice: number | null
  onConfirm: () => void
  isClosing: boolean
}

const ConfirmCloseDialog = ({
  open,
  onOpenChange,
  position,
  symbol,
  markPrice,
  onConfirm,
  isClosing,
}: ConfirmCloseDialogProps) => {
  if (!open || !position) return null

  const notional = typeof markPrice === 'number' ? markPrice * position.baseSize : null
  const pnl = position.unrealizedPnl ?? 0
  const pnlClass = pnl >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => !isClosing && onOpenChange(false)} />
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-border/40 bg-card shadow-xl">
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div className="text-sm font-semibold">Close Position</div>
        </div>

        <div className="p-4 text-sm">
          <div className="mb-4 text-muted-foreground">
            Are you sure you want to close your {symbol ?? `#${position.marketIndex}`} position?
          </div>

          <div className="space-y-2 rounded-md border border-border/40 bg-muted/10 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Side</span>
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-semibold uppercase',
                  position.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                )}
              >
                {position.side}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{position.baseSize.toFixed(4)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Entry Price</span>
              <span className="font-medium">${position.entryPrice?.toFixed(2) ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Mark Price</span>
              <span className="font-medium">${markPrice?.toFixed(2) ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Notional</span>
              <span className="font-medium">${notional?.toFixed(2) ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unrealized PnL</span>
              <span className={cn('font-semibold', pnlClass)}>
                {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-amber-400/80">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>This will submit a market order to close the position at the current market price.</span>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border/40 px-4 py-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isClosing}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            disabled={isClosing}
          >
            {isClosing ? 'Closing...' : 'Close Position'}
          </Button>
        </div>
      </div>
    </div>
  )
}

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
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closingPosition, setClosingPosition] = useState<PerpPositionDetails | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const { toasts, showToast } = useToast()
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

  const handleClosePosition = useCallback(
    async (position: PerpPositionDetails) => {
      setClosingPosition(position)
      setCloseDialogOpen(true)
    },
    []
  )

  const handleConfirmClose = useCallback(async () => {
    if (!closingPosition) return

    setIsClosing(true)
    try {
      // First, refresh positions to ensure we have the latest data
      const latestPositions = await fetchPositions()
      if (latestPositions) {
        setPositions(latestPositions)

        // Check if position still exists in latest data
        const currentPosition = latestPositions.find(p => p.marketIndex === closingPosition.marketIndex)

        if (!currentPosition || !currentPosition.baseSize || currentPosition.baseSize <= 0) {
          showToast('Position was already closed', 'error')
          setCloseDialogOpen(false)
          setClosingPosition(null)
          setIsClosing(false)
          return
        }
      }

      const snapshot = snapshots[closingPosition.marketIndex]
      const markPrice = snapshot?.markPrice

      if (!markPrice) {
        showToast('Unable to close position: market price unavailable', 'error')
        setIsClosing(false)
        return
      }
      // To close a position, we need to place an order in the opposite direction
      const closeDirection = closingPosition.side === 'long' ? 'short' : 'long'

      const txSig = await closePerpPosition(
        closingPosition.marketIndex,
        closeDirection,
        closingPosition.baseSize,
        markPrice
      )

      console.log('[DriftPositions] close submitted', {
        txSig,
        marketIndex: closingPosition.marketIndex,
        side: closingPosition.side
      })

      showToast(
        `Position closed successfully! Tx: ${txSig.slice(0, 8)}...`,
        'success'
      )

      // Refresh positions
      const list = await fetchPositions()
      if (list) setPositions(list)

      setCloseDialogOpen(false)
      setClosingPosition(null)
    } catch (e) {
      console.error('[DriftPositions] failed to close position', e)
      const errorMsg = e instanceof Error ? e.message : 'Unknown error'

      // Show specific error messages for known issues
      if (errorMsg.includes('zero size')) {
        showToast('Position was already closed', 'error')
        // Refresh to update UI
        const list = await fetchPositions()
        if (list) setPositions(list)
        setCloseDialogOpen(false)
        setClosingPosition(null)
      } else if (errorMsg.includes('not found')) {
        showToast('Position not found', 'error')
        // Refresh to update UI
        const list = await fetchPositions()
        if (list) setPositions(list)
        setCloseDialogOpen(false)
        setClosingPosition(null)
      } else {
        showToast('Failed to close position. Please retry.', 'error')
      }
    } finally {
      setIsClosing(false)
    }
  }, [closingPosition, snapshots, showToast, fetchPositions])

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
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => handleClosePosition(position)}
                  disabled={isClosing}
                >
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

      <ConfirmCloseDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        position={closingPosition}
        symbol={closingPosition ? marketMap.get(closingPosition.marketIndex)?.symbol : undefined}
        markPrice={closingPosition ? snapshots[closingPosition.marketIndex]?.markPrice ?? null : null}
        onConfirm={handleConfirmClose}
        isClosing={isClosing}
      />

      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default DriftPositions
