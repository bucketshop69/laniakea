import { useEffect, useState } from 'react'
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
      <div className="min-h-0 basis-[30%] space-y-2">
        <DriftPositions />
      </div>
    </div>
  )
}

export default DriftOverview
