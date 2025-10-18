import { Fragment, useEffect, useMemo, useState } from 'react'
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
import { useMeteoraDataStore } from '@/modules/meteora/state'
import type { MeteoraPairGroup, MeteoraPool } from '@/modules/meteora/types/domain'

interface MeteoraDiscoverProps {
  onSelect?: (pool: MeteoraPool) => void
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(2)
}

const MeteoraDiscover = ({ onSelect }: MeteoraDiscoverProps) => {
  const [keyword, setKeyword] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const meteora = useMeteoraDataStore((state) => state.data)
  const fetchPairGroupsData = useMeteoraDataStore((state) => state.fetchPairGroupsData)
  const fetchPoolsForPairGroup = useMeteoraDataStore((state) => state.fetchPoolsForPairGroup)
  const getPoolsForPairGroup = useMeteoraDataStore((state) => state.getPoolsForPairGroup)

  // Fetch pair groups on mount
  useEffect(() => {
    void fetchPairGroupsData()
  }, [fetchPairGroupsData])

  const filteredPairGroups = useMemo(() => {
    const data = meteora.pairGroups
    if (!keyword.trim()) return data
    const lower = keyword.trim().toLowerCase()
    return data.filter((group) =>
      group.group_name.toLowerCase().includes(lower) ||
      group.token_x.toLowerCase().includes(lower) ||
      group.token_y.toLowerCase().includes(lower)
    )
  }, [meteora.pairGroups, keyword])

  const handleSearchChange = (value: string) => {
    setKeyword(value)
  }

  const toggleExpand = async (pairGroup: MeteoraPairGroup) => {
    const key = pairGroup.lexical_order_mints
    const isCurrentlyExpanded = expanded[key]

    // If collapsing, just toggle
    if (isCurrentlyExpanded) {
      setExpanded((prev) => ({ ...prev, [key]: false }))
      return
    }

    // If expanding, fetch pools if not already cached
    setExpanded((prev) => ({ ...prev, [key]: true }))
    await fetchPoolsForPairGroup(key)
  }

  return (
    <div className="space-y-1 p-1">
      <div className="flex items-center gap-1">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search pair groups by token"
          value={keyword}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="flex-1"
        />
      </div>

      <div className="max-h-[420px] overflow-auto rounded-md border border-border/40">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[30%] bg-card">Pair</TableHead>
              <TableHead className="bg-card">TVL</TableHead>
              <TableHead className="bg-card">Volume (24h)</TableHead>
              <TableHead className="bg-card">Max Fee/TVL</TableHead>
              <TableHead className="bg-card">Farm APY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meteora.isLoadingPairGroups && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-xs text-muted-foreground">
                  Loading pair groups…
                </TableCell>
              </TableRow>
            )}
            {meteora.error && !meteora.isLoadingPairGroups && (
              <TableRow>
                <TableCell colSpan={6} className="py-4 text-center text-xs text-red-400">
                  Failed to load pair groups. Please try again.
                </TableCell>
              </TableRow>
            )}
            {!meteora.isLoadingPairGroups && filteredPairGroups.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                  No pair groups found for the current filter.
                </TableCell>
              </TableRow>
            )}
            {filteredPairGroups.map((pairGroup) => {
              const key = pairGroup.lexical_order_mints
              const isExpanded = expanded[key]
              const pools = getPoolsForPairGroup(key)

              return (
                <Fragment key={key}>
                  <TableRow
                    className="cursor-pointer hover:bg-muted/20"
                    onClick={() => toggleExpand(pairGroup)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">
                            {pairGroup.group_name}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>${formatNumber(pairGroup.total_tvl)}</TableCell>
                    <TableCell>${formatNumber(pairGroup.total_volume)}</TableCell>
                    <TableCell>{formatNumber(pairGroup.max_fee_tvl_ratio)}%</TableCell>
                    <TableCell>{formatNumber(pairGroup.max_farm_apy)}%</TableCell>
                  </TableRow>

                  {isExpanded && (
                    <>
                      {meteora.isLoadingPools && !pools && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/10 py-2 text-center text-xs text-muted-foreground">
                            Loading pools…
                          </TableCell>
                        </TableRow>
                      )}
                      {pools && pools.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/10 py-2 text-center text-xs text-muted-foreground">
                            No pools available.
                          </TableCell>
                        </TableRow>
                      )}
                      {pools && pools.map((pool) => (
                        <TableRow
                          key={pool.address}
                          className="bg-muted/10 cursor-pointer hover:bg-muted/30"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelect?.(pool)
                          }}
                        >
                          <TableCell>
                            <div className="ml-1 border-l border-muted-foreground/30 pl-1">
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-blue" />
                                <span className="text-xs text-muted-foreground">
                                  (Bin {pool.bin_step})
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">${formatNumber(parseFloat(pool.liquidity))}</TableCell>
                          <TableCell className="text-xs">${formatNumber(pool.trade_volume_24h)}</TableCell>
                          <TableCell className="text-xs">{formatNumber(pool.fee_tvl_ratio.hour_24)}%</TableCell>
                          <TableCell className="text-xs">{formatNumber(pool.farm_apy)}%</TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default MeteoraDiscover
