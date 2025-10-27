import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Loader2, AlertCircle, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { useProfileStore } from '../state/profileStore'
import MeteoraProfile from '@/modules/meteora/components/MeteoraProfile'
import DriftPositions from '@/modules/drift/components/DriftPositions'

export const ProfilePanel = () => {
  const { publicKey, connected } = useWallet()
  const { setVisible: setWalletModalVisible } = useWalletModal()
  const [refreshKey, setRefreshKey] = useState(0)

  const overview = useProfileStore((state) => state.overview)
  const isLoading = useProfileStore((state) => state.isLoading)
  const error = useProfileStore((state) => state.error)
  const fetchProfile = useProfileStore((state) => state.fetchProfile)
  const clearProfile = useProfileStore((state) => state.clearProfile)

  // Fetch profile data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      fetchProfile(publicKey.toString())
    } else {
      clearProfile()
    }
  }, [connected, publicKey, fetchProfile, clearProfile])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Format percentage
  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  // Not connected state
  if (!connected) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <Card className="p-8 text-center border-border/40 bg-card/40">
          <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-primary mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to view your portfolio value and token holdings.
          </p>
          <Button onClick={() => setWalletModalVisible(true)}>
            Connect Wallet
          </Button>
        </Card>
      </div>
    )
  }

  // Loading state
  if (isLoading && !overview) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col p-4">
        <Card className="border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium mb-1">
                Failed to load profile
              </p>
              <p className="text-xs text-destructive/80">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => publicKey && fetchProfile(publicKey.toString(), true)}
                className="mt-3 border-destructive/50 text-destructive hover:bg-destructive/20"
              >
                Retry
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // No data state
  if (!overview) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <Card className="p-8 text-center border-dashed border-border/40 bg-card/20">
          <p className="text-sm text-muted-foreground">
            No portfolio data available.
          </p>
        </Card>
      </div>
    )
  }

  const { totalValue, change24h, changePercent24h, tokenCount } = overview

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border/40">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-primary">Portfolio</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (publicKey) {
                fetchProfile(publicKey.toString(), true)
                setRefreshKey((k) => k + 1)
              }
            }}
            disabled={isLoading}
            className="text-xs h-7"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>

        {/* Total Value - Large Display */}
        <div className="mb-1">
          <p className="text-3xl  text-primary">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* 24h Change */}
        <div className="flex items-center gap-2 text-sm">
          {changePercent24h >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span
            className={
              changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'
            }
          >
            {formatCurrency(change24h)} ({formatPercent(changePercent24h)})
          </span>
          <span className="text-muted-foreground">24h</span>
        </div>

        {/* Token Count */}
        <div className="mt-2 text-xs text-muted-foreground">
          {tokenCount} {tokenCount === 1 ? 'token' : 'tokens'}
        </div>
      </div>

      {/* Content - Combined Positions */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs defaultValue="drift" className="flex h-full flex-col">
          <TabsList className="shrink-0 w-full justify-start gap-1">
            <TabsTrigger value="drift">Perps (Drift)</TabsTrigger>
            <TabsTrigger value="meteora">Liquidity (Meteora)</TabsTrigger>
          </TabsList>
          <TabsContent value="drift" className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              <DriftPositions key={`drift-${refreshKey}`} />
            </div>
          </TabsContent>
          <TabsContent value="meteora" className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              <MeteoraProfile embedded key={`meteora-${refreshKey}`} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
