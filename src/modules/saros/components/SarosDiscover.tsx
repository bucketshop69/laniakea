import { Fragment, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useDappStore, type SarosPoolOverview } from '@/store/dappStore'

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(2)
}

const SarosDiscover = () => {
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const saros = useDappStore((state) => state.saros)
  const fetchSarosData = useDappStore((state) => state.fetchSarosData)

  const filteredPools = useMemo(() => {
    const data = saros.pools
    if (!keyword.trim()) return data
    const lower = keyword.trim().toLowerCase()
    return data.filter((pool) => {
      const matchesTopLevel =
        pool.tokenX.symbol.toLowerCase().includes(lower) ||
        pool.tokenY.symbol.toLowerCase().includes(lower) ||
        pool.tokenX.name.toLowerCase().includes(lower) ||
        pool.tokenY.name.toLowerCase().includes(lower)

      if (matchesTopLevel) return true

      return pool.pairs.some((pair) =>
        pair.pair.toLowerCase().includes(lower) ||
        pair.tokenX.symbol.toLowerCase().includes(lower) ||
        pair.tokenY.symbol.toLowerCase().includes(lower)
      )
    })
  }, [saros.pools, keyword])

  const handleSearchChange = (value: string) => {
    setKeyword(value)

    const params = new URLSearchParams({
      size: '20',
      order: '-volume24h',
      page: '1',
    })
    if (value.trim()) {
      params.set('keyword', value.trim())
    }

    void fetchSarosData({ force: true, endpointOverride: params.toString() })
  }

  const toggleExpand = (pool: SarosPoolOverview) => {
    const key = `${pool.tokenX.mintAddress}-${pool.tokenY.mintAddress}`
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-1 p-1">
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pools by token or address"
          value={keyword}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="flex-1"
        />
      </div>

      <div className="max-h-[420px] overflow-auto rounded-md border border-border/40">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[40%] bg-card">Pool</TableHead>
              <TableHead className="bg-card">APR</TableHead>
              <TableHead className="bg-card">Fees (24h)</TableHead>
              <TableHead className="bg-card">Liquidity</TableHead>
              <TableHead className="bg-card">Volume (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {saros.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-xs text-muted-foreground">
                  Loading pools…
                </TableCell>
              </TableRow>
            )}
            {saros.error && !saros.isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center text-xs text-red-400">
                  Failed to load pools. Please try again.
                </TableCell>
              </TableRow>
            )}
            {!saros.isLoading && filteredPools.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                  No pools found for the current filter.
                </TableCell>
              </TableRow>
            )}
            {filteredPools.map((pool) => {
              const key = `${pool.tokenX.mintAddress}-${pool.tokenY.mintAddress}`
              const multiplePairs = pool.pairs.length > 1
              const isExpanded = expanded[key]

              return (
                <Fragment key={key}>
                  <TableRow
                    className={multiplePairs ? 'cursor-pointer' : undefined}
                    onClick={() => {
                      if (multiplePairs) {
                        toggleExpand(pool)
                      }
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {multiplePairs ? (
                          isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-blue" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">
                            {pool.tokenX.symbol}/{pool.tokenY.symbol}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatNumber(pool.apr24h)}%</TableCell>
                    <TableCell>${formatNumber(pool.fees24h)}</TableCell>
                    <TableCell>${formatNumber(pool.totalLiquidity)}</TableCell>
                    <TableCell>${formatNumber(pool.volume24h)}</TableCell>
                  </TableRow>

                  {multiplePairs && isExpanded && pool.pairs.map((pair) => (
                    <TableRow key={pair.pair} className="bg-muted/10">
                      <TableCell>
                        <div className="ml-1 border-l border-muted-foreground/30 pl-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Bin {pair.binStep}</span>
                            <span className="text-xs">
                              {pair.tokenX.symbol}/{pair.tokenY.symbol}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(pair.apr24h)}%</TableCell>
                      <TableCell>${formatNumber(pair.fees24h)}</TableCell>
                      <TableCell>${formatNumber(pair.totalLiquidity)}</TableCell>
                      <TableCell>${formatNumber(pair.volume24h)}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SarosDiscover
