import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useDriftMarketsStore } from '../state'
import { cn } from '@/lib/utils'

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(2)
}

const formatPrice = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return value > 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(4)}`
}

const formatPercent = (value: number | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}



const DriftMarketDiscovery = () => {
  const [keyword, setKeyword] = useState('')

  const markets = useDriftMarketsStore((state) => state.markets)
  const snapshots = useDriftMarketsStore((state) => state.snapshots)
  const marketStatus = useDriftMarketsStore((state) => state.marketStatus)
  const marketError = useDriftMarketsStore((state) => state.marketError)
  const selectedMarketIndex = useDriftMarketsStore((state) => state.selectedMarketIndex)
  const selectMarket = useDriftMarketsStore((state) => state.selectMarket)

  const filteredMarkets = markets.filter((market) => {
    if (!keyword.trim()) return true
    const lower = keyword.trim().toLowerCase()
    return (
      market.symbol.toLowerCase().includes(lower) ||
      market.baseAssetSymbol.toLowerCase().includes(lower)
    )
  })

  const handleMarketSelect = (marketIndex: number) => {
    selectMarket(marketIndex)
  }

  return (
    <div className="space-y-1 p-1">
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search markets by symbol"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className="flex-1"
        />
      </div>

      <div className="max-h-[420px] overflow-auto rounded-md border border-border/40">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40%] bg-card">Market</TableHead>
              <TableHead className="bg-card">Price</TableHead>
              <TableHead className="bg-card">24H %</TableHead>
              <TableHead className="bg-card">Funding</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketStatus === 'loading' && (
              <TableRow>
                <TableCell colSpan={4} className="py-4 text-center text-xs text-muted-foreground">
                  Loading markets…
                </TableCell>
              </TableRow>
            )}
            {marketStatus === 'error' && (
              <TableRow>
                <TableCell colSpan={4} className="py-4 text-center text-xs text-red-400">
                  {marketError ?? 'Failed to load markets. Please try again.'}
                </TableCell>
              </TableRow>
            )}
            {marketStatus === 'ready' && filteredMarkets.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">
                  No markets found for the current filter.
                </TableCell>
              </TableRow>
            )}
            {marketStatus === 'ready' && filteredMarkets.map((market) => {
              const snapshot = snapshots[market.marketIndex]
              const isSelected = selectedMarketIndex === market.marketIndex
              return (
                <TableRow 
                  key={market.marketIndex}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-blue/10 hover:bg-blue/15'
                  )}
                  onClick={() => handleMarketSelect(market.marketIndex)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-primary">{market.symbol}</span>
                      <span className="text-xs text-muted-foreground">{market.baseAssetSymbol}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(snapshot?.markPrice)}</TableCell>
                  <TableCell
                    className={cn(
                      snapshot?.change24hPct === undefined
                        ? 'text-muted-foreground'
                        : snapshot.change24hPct >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    )}
                  >
                    {formatPercent(snapshot?.change24hPct)}
                  </TableCell>
                  <TableCell>{formatPercent(snapshot?.fundingRate24hPct)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DriftMarketDiscovery
