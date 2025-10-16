import { useEffect, useState } from 'react'
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
import { useDriftPositionsStore } from '../state'
import {
  getSpotAssets,
  getAllSpotBalances,
  type SpotAsset,
} from '../services/driftPositionService'
import DriftDepositModal from './DriftDepositModal'
import DriftPositions from './DriftPositions'

const DriftOverview = () => {
  const usdcBalance = useDriftPositionsStore((s) => s.usdcBalance)

  const [assets, setAssets] = useState<SpotAsset[]>([])
  const [spotBalances, setSpotBalances] = useState<Record<number, number>>({})
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositMarketIndex, setDepositMarketIndex] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const started = performance.now()
      console.log('[Overview] loading assets and balances…')
      const warnTimer = setTimeout(() => {
        if (!cancelled) console.warn('[Overview] still loading assets/balances after 3s…')
      }, 3000)
      try {
        const [list, bals] = await Promise.all([
          getSpotAssets(),
          getAllSpotBalances(),
        ])
        if (!cancelled) {
          setAssets(list)
          const balMap: Record<number, number> = {}
          bals.forEach((b) => {
            balMap[b.marketIndex] = b.amount
          })
          setSpotBalances(balMap)
          const took = performance.now() - started
          console.log('[Overview] loaded', { assets: list.length, balances: bals.length, ms: Math.round(took) })
          console.debug('[Overview] assets list', list)
        }
      } catch (e) {
        console.error('[Overview] failed to load assets/balances', e)
      }
      clearTimeout(warnTimer)
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Positions - 30% */}
      <div className="min-h-0 basis-[30%] space-y-2">
        {/* <div className="text-xs text-muted-foreground">Perp Positions</div> */}
        <DriftPositions />
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
