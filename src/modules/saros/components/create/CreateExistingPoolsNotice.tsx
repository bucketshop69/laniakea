import { Card } from '@/components/ui/card'
import { Loader2, Info } from 'lucide-react'
import type { ExistingPool } from '../../services/tokenService'
import type { SarosToken } from '../../services/tokenService'

interface CreateExistingPoolsNoticeProps {
  isChecking: boolean
  baseToken: SarosToken | null
  quoteToken: SarosToken | null
  pools: ExistingPool[]
}

const CreateExistingPoolsNotice = ({
  isChecking,
  baseToken,
  quoteToken,
  pools,
}: CreateExistingPoolsNoticeProps) => {
  if (isChecking && baseToken && quoteToken) {
    return (
      <Card className="border-blue-500/50 bg-blue-500/10 p-3">
        <div className="flex items-start gap-2">
          <Loader2 className="h-5 w-5 text-blue-500 mt-0.5 shrink-0 animate-spin" />
          <p className="text-sm text-blue-500">Checking for existing pools...</p>
        </div>
      </Card>
    )
  }

  if (pools.length === 0) {
    return null
  }

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/10 p-3">
      <div className="flex items-start gap-2">
        <Info className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-yellow-500">
            {pools.length} pool{pools.length > 1 ? 's' : ''} already exist for this token pair
          </p>
          <div className="space-y-2">
            {pools.map((pool) => (
              <div key={pool._id} className="text-xs text-muted-foreground bg-background/50 rounded p-2">
                <div className="font-medium">
                  {pool.tokenX.symbol?.toUpperCase() || 'TOKEN'} / {pool.tokenY.symbol?.toUpperCase() || 'TOKEN'}
                </div>
                <div className="mt-1">Bin Step: {pool.binStep} ({(pool.binStep / 100).toFixed(2)}%)</div>
                <div className="mt-1 font-mono text-[10px] truncate">Pool: {pool.pair}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-500">
            Consider using an existing pool or choose a different bin step if you want to create a new one.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default CreateExistingPoolsNotice
