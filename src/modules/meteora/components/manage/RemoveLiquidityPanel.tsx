import { AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export interface MeteoraDisplayPosition {
  positionMint: string
  position: string
  lowerBinId: number
  upperBinId: number
  minPrice: number | null
  maxPrice: number | null
  totalBins: number
  baseAmount: number
  quoteAmount: number
  totalValue: number | null
}

interface RemoveLiquidityPanelProps {
  removeError: string | null
  removeSuccess: string | null
  positionsLoading: boolean
  positionsError: string | null
  positions: MeteoraDisplayPosition[]
  baseSymbol: string
  quoteSymbol: string
  removingMint: string | null
  onRemove: (position: MeteoraDisplayPosition) => void
  formatTokenAmount: (value: number) => string
  formatInteger: (value: number) => string
  formatValueAmount: (value: number | null) => string
}

const RemoveLiquidityPanel = ({
  removeError,
  removeSuccess,
  positionsLoading,
  positionsError,
  positions,
  baseSymbol,
  quoteSymbol,
  removingMint,
  onRemove,
  formatTokenAmount,
  formatInteger,
  formatValueAmount,
}: RemoveLiquidityPanelProps) => {
  if (positionsLoading) {
    return (
      <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 p-2 text-xs">
        {removeError && (
          <Card className="border-red-500/50 bg-red-500/10 p-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-[10px] text-red-500">{removeError}</p>
            </div>
          </Card>
        )}
        {removeSuccess && (
          <Card className="border-green-500/50 bg-green-500/10 p-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-green-500" />
              <p className="text-[10px] text-green-500 break-all">{removeSuccess}</p>
            </div>
          </Card>
        )}
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading positions…
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 p-2 text-xs">
      {removeError && (
        <Card className="border-red-500/50 bg-red-500/10 p-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[10px] text-red-500">{removeError}</p>
          </div>
        </Card>
      )}
      {removeSuccess && (
        <Card className="border-green-500/50 bg-green-500/10 p-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-green-500" />
            <p className="text-[10px] text-green-500 break-all">{removeSuccess}</p>
          </div>
        </Card>
      )}
      {positionsError ? (
        <Card className="border-red-500/50 bg-red-500/10 p-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[10px] text-red-500">{positionsError}</p>
          </div>
        </Card>
      ) : positions.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/40 p-4 text-muted-foreground">
          No Meteora liquidity positions found for this pool.
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-auto">
          {positions.map((position, index) => {
            const headerLabel = `${baseSymbol} / ${quoteSymbol} — Position #${index + 1}`
            const valueLabel = position.totalValue !== null
              ? `≈ ${formatValueAmount(position.totalValue)} ${quoteSymbol}`
              : '—'
            const rangeLabel = position.minPrice !== null && position.maxPrice !== null
              ? `$${position.minPrice.toFixed(4)} → $${position.maxPrice.toFixed(4)}`
              : `${formatInteger(position.lowerBinId)} → ${formatInteger(position.upperBinId)}`
            return (
              <Card key={position.positionMint} className="rounded-lg border border-border/50 bg-card/40 p-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-primary/80">
                  <span>{headerLabel}</span>
                  <span className="text-muted-foreground">{valueLabel}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Token X</span>
                      <span className="text-primary/80">{formatTokenAmount(position.baseAmount)} {baseSymbol}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Token Y</span>
                      <span className="text-primary/80">{formatTokenAmount(position.quoteAmount)} {quoteSymbol}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Bin Range</span>
                      <span className="text-primary/80">{rangeLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Bins</span>
                      <span className="text-primary/80">{formatInteger(position.totalBins)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3 w-full text-xs"
                  onClick={() => onRemove(position)}
                  disabled={removingMint === position.positionMint}
                >
                  {removingMint === position.positionMint && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {removingMint === position.positionMint ? 'Removing Liquidity…' : 'Remove Liquidity'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RemoveLiquidityPanel
