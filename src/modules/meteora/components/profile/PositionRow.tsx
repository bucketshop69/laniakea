import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { MeteoraProfilePosition } from '../../types/domain'

interface PositionRowProps {
  position: MeteoraProfilePosition
  index: number
  onClaimFees: (positionMint: string) => void
  onRemoveLiquidity: (positionMint: string) => void
  claimingMint: string | null
  removingMint: string | null
}

const PositionRow = ({
  position,
  index,
  onClaimFees,
  onRemoveLiquidity,
  claimingMint,
  removingMint,
}: PositionRowProps) => {
  const formatTokenAmount = (amount: number, decimals: number = 4) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  const formatValue = (value: number | null) => {
    if (value === null) return '—'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const rangeLabel =
    position.minPrice !== null && position.maxPrice !== null
      ? `$${position.minPrice.toFixed(4)} → $${position.maxPrice.toFixed(4)}`
      : '—'

  const hasFees = position.unclaimedFeeX > 0 || position.unclaimedFeeY > 0

  const isClaiming = claimingMint === position.positionMint
  const isRemoving = removingMint === position.positionMint
  const isProcessing = isClaiming || isRemoving

  return (
    <div className="p-1 border-b border-border/30 last:border-b-0 bg-card/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-medium text-primary/80 mb-1">
            Position #{index + 1}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {position.positionMint.slice(0, 8)}...{position.positionMint.slice(-6)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total Value</div>
          <div className="text-sm font-semibold text-primary">
            {formatValue(position.totalValue)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{position.tokenXSymbol}</span>
            <span className="text-primary/80 font-mono">
              {formatTokenAmount(position.tokenXAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{position.tokenYSymbol}</span>
            <span className="text-primary/80 font-mono">
              {formatTokenAmount(position.tokenYAmount)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Range</span>
            <span className="text-primary/80 font-mono text-[9px]">{rangeLabel}</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Bins</span>
            <span className="text-primary/80 font-mono">{position.totalBins}</span>
          </div>
        </div>
      </div>

      {hasFees && (
        <div className="p-2 rounded bg-green-500/5 border border-green-500/20 mb-3 space-y-1">
          {position.unclaimedFeeX > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Unclaimed Fee {position.tokenXSymbol}</span>
              <span className="text-xs font-semibold text-green-500 font-mono">
                {position.unclaimedFeeX.toFixed(5)}
              </span>
            </div>
          )}
          {position.unclaimedFeeY > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Unclaimed Fee {position.tokenYSymbol}</span>
              <span className="text-xs font-semibold text-green-500 font-mono">
                {position.unclaimedFeeY.toFixed(5)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          onClick={() => onClaimFees(position.positionMint)}
          disabled={isProcessing || !hasFees}
        >
          {isClaiming && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Claim Fees
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          onClick={() => onRemoveLiquidity(position.positionMint)}
          disabled={isProcessing}
        >
          {isRemoving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Remove
        </Button>
      </div>
    </div>
  )
}

export default PositionRow
