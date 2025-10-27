import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader2, AlertCircle, Wallet } from 'lucide-react'
import { getSolanaConnection } from '@/lib/solanaConnection'
import { getAllUserPositions, calculatePortfolioStats } from '../services/profile'
import { 
  executeRemoveLiquidity, 
  handleRemoveLiquidityError,
  executeClaimFees,
  handleClaimFeesError
} from '../services/liquidity'
import type { MeteoraProfilePoolGroup, MeteoraPortfolioStats } from '../types/domain'
import PoolPositionCard from './profile/PoolPositionCard'

const MeteoraProfile = ({ embedded = false }: { embedded?: boolean }) => {
  const { publicKey, connected, signTransaction } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const connection = useMemo(() => getSolanaConnection(), [])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [poolGroups, setPoolGroups] = useState<MeteoraProfilePoolGroup[]>([])
  const [stats, setStats] = useState<MeteoraPortfolioStats>({
    totalValue: 0,
    totalPositions: 0,
    totalPools: 0,
    totalUnclaimedFees: 0,
  })

  const [claimingMint, setClaimingMint] = useState<string | null>(null)
  const [removingMint, setRemovingMint] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-dismiss success message
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(() => setSuccessMessage(null), 30000)
    return () => clearTimeout(timer)
  }, [successMessage])

  // Auto-dismiss error message
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 30000)
    return () => clearTimeout(timer)
  }, [error])

  // Fetch user positions
  const fetchPositions = useCallback(async () => {
    if (!publicKey) return

    setIsLoading(true)
    setError(null)

    try {
      const pools = await getAllUserPositions(publicKey.toString())
      setPoolGroups(pools)

      const portfolioStats = calculatePortfolioStats(pools)
      setStats(portfolioStats)
    } catch (err) {
      console.error('Failed to fetch positions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load positions')
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  // Fetch on mount and when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchPositions()
    }
  }, [connected, publicKey, fetchPositions])

  // Claim fees handler
  const handleClaimFees = async (positionMint: string, poolAddress: string) => {
    if (!publicKey || !connected) {
      setWalletModalVisible(true)
      return
    }

    if (!signTransaction) {
      setError('Wallet does not support transaction signing')
      return
    }

    setClaimingMint(positionMint)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('[Profile] Claiming fees', { positionMint, poolAddress })

      // Execute claim fees via service layer
      const signature = await executeClaimFees({
        poolAddress,
        positionMint,
        userPublicKey: publicKey,
        connection,
        signTransaction,
      })

      setSuccessMessage(`Fees claimed! Tx: ${signature}`)

      // Refresh all positions across all pools
      await fetchPositions()
    } catch (err) {
      console.error('[Profile] Claim fees failed', err)
      setError(handleClaimFeesError(err))
    } finally {
      setClaimingMint(null)
    }
  }

  // Remove liquidity handler
  const handleRemoveLiquidity = async (positionMint: string, poolAddress: string) => {
    if (!publicKey || !connected) {
      setWalletModalVisible(true)
      return
    }

    if (!signTransaction) {
      setError('Wallet does not support transaction signing')
      return
    }

    setRemovingMint(positionMint)
    setError(null)
    setSuccessMessage(null)

    try {
      console.log('[Profile] Removing liquidity', { positionMint, poolAddress })

      // Execute remove liquidity via service layer
      const signature = await executeRemoveLiquidity({
        poolAddress,
        positionMint,
        userPublicKey: publicKey,
        connection,
        signTransaction,
      })

      setSuccessMessage(`Liquidity removed! Tx: ${signature}`)

      // Refresh all positions across all pools
      await fetchPositions()
    } catch (err) {
      console.error('[Profile] Remove liquidity failed', err)
      setError(handleRemoveLiquidityError(err))
    } finally {
      setRemovingMint(null)
    }
  }

  // Claim all fees handler
  const handleClaimAllFees = async () => {
    if (!publicKey || stats.totalUnclaimedFees === 0) return

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // TODO: Implement claim all fees transaction
      console.log('Claiming all fees across all positions')

      // Placeholder success
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setSuccessMessage(`Successfully claimed all fees: $${stats.totalUnclaimedFees.toFixed(2)}`)

      // Refresh positions
      await fetchPositions()
    } catch (err) {
      console.error('Failed to claim all fees:', err)
      setError(err instanceof Error ? err.message : 'Failed to claim all fees')
    } finally {
      setIsLoading(false)
    }
  }

  // Not connected state
  if (!connected) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center border-border/40 bg-card/40">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to view your Meteora positions and portfolio.
          </p>
          <Button onClick={() => setWalletModalVisible(true)}>
            Connect Wallet
          </Button>
        </Card>
      </div>
    )
  }

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header with Stats (hidden when embedded) */}
      {!embedded && (
        <div className="shrink-0 px-2 py-1 border-b border-border/40">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-primary">Portfolio</h2>

            {isLoading && poolGroups.length === 0 ? (
              <div className="flex items-center gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex flex-col items-end gap-1">
                    <div className="h-3 bg-muted rounded w-12 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Positions</div>
                  <div className="text-sm font-semibold text-primary">
                    {formatNumber(stats.totalPositions)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Pools</div>
                  <div className="text-sm font-semibold text-primary">
                    {formatNumber(stats.totalPools)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Error Message */}
        {error && (
          <Card className="mb-4 border-red-500/50 bg-red-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </Card>
        )}

        {/* Success Message */}
        {successMessage && (
          <Card className="mb-4 border-green-500/50 bg-green-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-green-500" />
              <p className="text-xs text-green-500 break-all">{successMessage}</p>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && poolGroups.length === 0 && !error && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* No Positions State */}
        {!isLoading && poolGroups.length === 0 && (
          <Card className="p-8 text-center border-dashed border-border/40 bg-card/20">
            <p className="text-sm text-muted-foreground">
              No Meteora liquidity positions found.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Add liquidity to a pool to see your positions here.
            </p>
          </Card>
        )}

        {/* Pool Groups */}
        {poolGroups.length > 0 && (
          <div>
            {poolGroups.map((poolGroup) => (
              <PoolPositionCard
                key={poolGroup.poolAddress}
                poolGroup={poolGroup}
                onClaimFees={handleClaimFees}
                onRemoveLiquidity={handleRemoveLiquidity}
                claimingMint={claimingMint}
                removingMint={removingMint}
              />
            ))}
          </div>
        )}


      </div>
    </div>
  )
}

export default MeteoraProfile
