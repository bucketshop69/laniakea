import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { PerpOrderSummary } from '../services/driftPositionService'

type DriftOrdersProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  symbol?: string
  orders: PerpOrderSummary[]
  cancellingOrderId: number | null
  onCancelOrder: (order: PerpOrderSummary) => Promise<void>
}

const formatCurrency = (
  value: number | null | undefined,
  { decimals = 2, signed = false }: { decimals?: number; signed?: boolean } = {}
) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const places = abs >= 1 ? decimals : Math.min(4, decimals + 2)
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}$${value.toFixed(places)}`
}

const formatNumber = (value: number | null | undefined, decimals = 4) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

const DriftOrders = ({
  open,
  onOpenChange,
  symbol,
  orders,
  cancellingOrderId,
  onCancelOrder,
}: DriftOrdersProps) => {
  if (!open) return null

  const handleBackgroundClick = () => {
    if (cancellingOrderId === null) onOpenChange(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleBackgroundClick} />
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-border/40 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="text-sm font-semibold">{symbol ? `${symbol} Orders` : 'Orders'}</div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onOpenChange(false)}
            disabled={cancellingOrderId !== null}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-4 text-xs">
          {orders.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">No connected orders</div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const price = order.price ?? order.triggerPrice
                const cancelling = cancellingOrderId === order.userOrderId

                return (
                  <div key={order.userOrderId} className="rounded-md border border-border/40 bg-muted/10 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold capitalize text-primary">{order.type}</span>
                        <span className="text-[10px] uppercase text-muted-foreground">{order.direction}</span>
                        {order.reduceOnly && <span className="text-[9px] uppercase text-amber-400">Reduce Only</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground">ID #{order.userOrderId}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div className="flex items-baseline justify-between gap-2">
                        <span>Qty</span>
                        <span className="text-foreground">{formatNumber(order.baseAmount)}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span>Filled</span>
                        <span className="text-foreground">{formatNumber(order.baseFilled)}</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span>{order.triggerPrice ? 'Trigger' : 'Price'}</span>
                        <span className="text-foreground">{formatCurrency(price, { decimals: 4 })}</span>
                      </div>
                      {order.triggerPrice && order.price && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span>Limit</span>
                          <span className="text-foreground">{formatCurrency(order.price, { decimals: 4 })}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancelOrder(order)}
                        disabled={cancelling}
                      >
                        {cancelling ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DriftOrders
