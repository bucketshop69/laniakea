import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSpotAssets, depositCollateral, getAccountMetrics, type SpotAsset } from '../services/driftPositionService'
import { useDriftPositionsStore as usePositionsStoreRef } from '../state/driftPositionsStore'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultAssetSymbol?: string
  selectedMarketIndex?: number | null
}

export const DriftDepositModal = ({ open, onOpenChange, defaultAssetSymbol = 'USDC', selectedMarketIndex }: Props) => {
  const [assets, setAssets] = useState<SpotAsset[]>([])
  const [asset, setAsset] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    getSpotAssets().then((list) => {
      console.log('[Deposit] spot assets', list)
      setAssets(list)
      const preferred = list.find((a) => a.symbol === defaultAssetSymbol) ?? list[0]
      if (preferred) setAsset(String(preferred.marketIndex))
    }).catch((e) => {
      console.error('[Deposit] failed to load spot assets', e)
    })
  }, [open, defaultAssetSymbol])

  const selectedAsset = useMemo(() => assets.find((a) => String(a.marketIndex) === asset), [assets, asset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-sm rounded-lg border border-border/40 bg-card p-4 shadow-xl">
        <div className="mb-3 text-sm font-semibold">Deposit Collateral</div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Asset</label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem key={a.marketIndex} value={String(a.marketIndex)}>{a.symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {error && <div className="text-xs text-destructive">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                setError(null)
                const amt = parseFloat(amount)
                if (!Number.isFinite(amt) || amt <= 0) {
                  setError('Enter a valid amount')
                  return
                }
                const marketIndex = Number(asset)
                if (!Number.isFinite(marketIndex)) {
                  setError('Select an asset')
                  return
                }
                setSubmitting(true)
                try {
                  const txSig = await depositCollateral(amt, marketIndex)
                  console.log('[Deposit] submitted', txSig)
                  const metrics = await getAccountMetrics(selectedMarketIndex ?? undefined)
                  usePositionsStoreRef.getState().setMetrics(metrics)
                  onOpenChange(false)
                  setAmount('')
                } catch (e) {
                  const message = e instanceof Error ? e.message : 'Deposit failed'
                  setError(message)
                  console.error('[Deposit] failed', e)
                } finally {
                  setSubmitting(false)
                }
              }}
              disabled={submitting}
            >
              {submitting ? 'Depositing…' : 'Deposit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriftDepositModal
