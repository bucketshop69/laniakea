import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useDriftMarketsStore, useDriftPositionsStore } from '../state'
import {
  getSpotAssets,
  getActivePerpPositionsSummary,
  getAllSpotBalances,
  type SpotAsset,
  type PerpPositionSummary,
} from '../services/driftPositionService'
import DriftDepositModal from './DriftDepositModal'

const formatPrice = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return value > 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`
}

const DriftOverview = () => {
  const snapshots = useDriftMarketsStore((s) => s.snapshots)
  const markets = useDriftMarketsStore((s) => s.markets)
  const marketByIndex = useMemo(() => {
    const map = new Map<number, { symbol: string; baseAssetSymbol: string }>()
    markets.forEach((m) => map.set(m.marketIndex, { symbol: m.symbol, baseAssetSymbol: m.baseAssetSymbol }))
    return map
  }, [markets])

  const usdcBalance = useDriftPositionsStore((s) => s.usdcBalance)

  const [positions, setPositions] = useState<PerpPositionSummary[]>([])
  const [assets, setAssets] = useState<SpotAsset[]>([])
  const [spotBalances, setSpotBalances] = useState<Record<number, number>>({})
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositMarketIndex, setDepositMarketIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const started = performance.now()
      console.log('[Overview] loading positions and assets…')
      const warnTimer = setTimeout(() => {
        if (!cancelled) console.warn('[Overview] still loading assets after 3s…')
      }, 3000)
      try {
        const [pos, list, bals] = await Promise.all([
          getActivePerpPositionsSummary(),
          getSpotAssets(),
          getAllSpotBalances(),
        ])
        if (!cancelled) {
          setPositions(pos)
          setAssets(list)
          const balMap: Record<number, number> = {}
          bals.forEach((b) => {
            balMap[b.marketIndex] = b.amount
          })
          setSpotBalances(balMap)
          const took = performance.now() - started
          console.log('[Overview] loaded', { positions: pos.length, assets: list.length, balances: bals.length, ms: Math.round(took) })
          console.debug('[Overview] assets list', list)
        }
      } catch (e) {
        console.error('[Overview] failed to load assets/positions', e)
      }
      clearTimeout(warnTimer)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const visiblePositions = positions.slice(0, 3)
  const pages = Math.ceil(positions.length / 3)

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Positions - 30% */}
      <div className="min-h-0 basis-[30%] space-y-2">
        <div className="text-xs text-muted-foreground">Perp Positions</div>
        {visiblePositions.length === 0 && (
          <Card className="p-2 text-xs text-muted-foreground">No active positions</Card>
        )}
        {visiblePositions.map((p) => {
          const snap = snapshots[p.marketIndex]
          const market = marketByIndex.get(p.marketIndex)
          const markPrice = snap?.markPrice
          return (
            <div
              key={`${p.marketIndex}-${p.side}`}
              className={cn(
                'rounded-md border px-2 py-1 text-[11px]',
                p.side === 'long' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary">{market?.symbol ?? `#${p.marketIndex}`}</span>
                  <span className={cn('rounded px-1 py-[1px] text-[10px] font-semibold', p.side === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                    {p.side.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">Size {p.baseSize.toFixed(4)}</span>
                </div>
                <div className="text-muted-foreground">Mark {formatPrice(markPrice)}</div>
              </div>
            </div>
          )
        })}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            {Array.from({ length: pages }).map((_, i) => (
              <span key={i} className={cn('mx-0.5', i === 0 ? 'text-foreground' : 'opacity-50')}>•</span>
            ))}
          </div>
        )}
      </div>

      {/* Assets overview - 10% */}
      <div className="min-h-0 basis-[10%]">
        <Card className="flex h-full items-center justify-between p-2">
          <div className="text-xs text-muted-foreground">Total Value</div>
          <div className="text-sm font-semibold">${typeof usdcBalance === 'number' ? usdcBalance.toFixed(2) : '—'}</div>
        </Card>
      </div>

      {/* Assets table - remaining */}
      <div className="min-h-0 flex-1 flex flex-col">
        <div className="mb-1 text-xs text-muted-foreground">Assets</div>
        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border/40">
          <Table>
            <TableHeader className="sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[40%] bg-card">Asset</TableHead>
                <TableHead className="bg-card">Balance</TableHead>
                <TableHead className="bg-card">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                    Loading assets…
                  </TableCell>
                </TableRow>
              )}
              {assets.map((asset) => {
                const balance = typeof spotBalances[asset.marketIndex] === 'number'
                  ? spotBalances[asset.marketIndex]
                  : null
                return (
                  <TableRow key={asset.marketIndex}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-primary">{asset.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell>{balance !== null ? balance.toFixed(4) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDepositMarketIndex(asset.marketIndex)
                            setDepositOpen(true)
                          }}
                        >
                          Deposit
                        </Button>
                        <Button size="sm" variant="outline" disabled>
                          Withdraw
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <DriftDepositModal
        open={depositOpen}
        onOpenChange={setDepositOpen}
        selectedMarketIndex={depositMarketIndex}
      />
    </div>
  )
}

export default DriftOverview
