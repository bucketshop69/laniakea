import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { MeteoraProfilePoolGroup } from '../../types/domain'
import PositionRow from './PositionRow'

interface PoolPositionCardProps {
  poolGroup: MeteoraProfilePoolGroup
  onClaimFees: (positionMint: string, poolAddress: string) => void
  onRemoveLiquidity: (positionMint: string, poolAddress: string) => void
  claimingMint: string | null
  removingMint: string | null
}

const PoolPositionCard = ({
  poolGroup,
  onClaimFees,
  onRemoveLiquidity,
  claimingMint,
  removingMint,
}: PoolPositionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatValue = (value: number) => {
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  return (
    <Card className="mb-1 overflow-hidden border-border/50 bg-card/40">
      <div
        className="flex items-center justify-between p-1 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <div className="text-sm font-semibold text-primary">
              {poolGroup.poolName}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {poolGroup.positions.length} position{poolGroup.positions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {poolGroup.apy > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">APY</div>
              <div className="text-green-500 font-semibold">
                {formatPercentage(poolGroup.apy)}%
              </div>
            </div>
          )}
          {poolGroup.tvl > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">TVL</div>
              <div className="text-primary/80 font-semibold">{formatValue(poolGroup.tvl)}</div>
            </div>
          )}
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Bin Step</div>
            <div className="text-primary/80 font-semibold">{poolGroup.binStep} bps</div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border/30">
          {poolGroup.positions.map((position, index) => (
            <PositionRow
              key={position.positionMint}
              position={position}
              index={index}
              onClaimFees={(mint) => onClaimFees(mint, poolGroup.poolAddress)}
              onRemoveLiquidity={(mint) => onRemoveLiquidity(mint, poolGroup.poolAddress)}
              claimingMint={claimingMint}
              removingMint={removingMint}
            />
          ))}
        </div>
      )}
    </Card>
  )
}

export default PoolPositionCard
