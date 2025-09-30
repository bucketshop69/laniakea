import { useMemo, useState } from 'react'
import { ArrowLeft, MinusCircle, PlusCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useDappStore } from '@/store/dappStore'
import { useFetchPoolMetadata } from '../hooks/useFetchPoolMetadata'
import { LiquidityShape } from '@saros-finance/dlmm-sdk/types/services'

type ManageTab = 'add' | 'remove'

interface SarosManageProps {
  onBack: () => void
}

const SarosManage = ({ onBack }: SarosManageProps) => {
  const pool = useDappStore((state) => state.saros.selectedPool)
  const [tab, setTab] = useState<ManageTab>('add')
  const [activeShape, setActiveShape] = useState<LiquidityShape>(LiquidityShape.Spot)
  const [baseAmount, setBaseAmount] = useState('')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bins, setBins] = useState('5')

  const poolAddress = pool?.pairs[0]?.pair
  const { metadata, price, isLoading, error } = useFetchPoolMetadata(poolAddress)

  if (!pool) {
    return (
      <Card className="flex h-full items-center justify-center rounded-2xl p-6 text-sm text-muted-foreground">
        Select a Saros pool from Discover to manage liquidity.
      </Card>
    )
  }

  const label = `${pool.tokenX.symbol}/${pool.tokenY.symbol}`
  let priceTone = 'text-[11px] text-muted-foreground'
  let priceLabel = '—'
  if (isLoading) {
    priceLabel = 'Loading…'
  } else if (error) {
    priceTone = 'text-[11px] text-red-400'
    priceLabel = error
  } else if (metadata) {
    priceLabel = price
      ? `1 ${pool.tokenX.symbol} ≈ ${Number(price).toFixed(6)} ${pool.tokenY.symbol}`
      : `Reserves: ${metadata.baseReserve} / ${metadata.quoteReserve}`
  }

  const shapeOptions = useMemo(
    () => (
      [
        { id: 'Spot' as LiquidityShape, label: 'Spot' },
        { id: 'Curve' as LiquidityShape, label: 'Curve' },
        { id: 'BidAsk' as LiquidityShape, label: 'Bid-Ask' },
      ]
    ),
    []
  )

  return (
    <Card className="h-full rounded-2xl p-1">
      <div className="flex h-full flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={onBack}
              aria-label="Back to pools"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-primary leading-none">{label}</span>
              <span className={priceTone}>{priceLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[
              { id: 'add' as ManageTab, label: 'Add Liquidity', icon: PlusCircle },
              { id: 'remove' as ManageTab, label: 'Remove Liquidity', icon: MinusCircle },
            ].map(({ id, label: tabLabel, icon: Icon }) => {
              const isActive = tab === id
              return (
                <Button
                  key={id}
                  type="button"
                  variant="ghost"
                  className={`relative h-8 px-3 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                    }`}
                  onClick={() => setTab(id)}
                >
                  <span className="flex items-center gap-1">
                    <Icon className="h-4 w-4" />
                    {tabLabel}
                  </span>
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-transparent'
                      }`}
                  ></span>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === 'add' ? (
            <div className="grid h-full grid-cols-12 gap-2 rounded-xl border border-border/40 p-3 text-xs text-muted-foreground">
              <div className="col-span-12 grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-6">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {pool.tokenX.symbol} Amount
                  </label>
                  <Input
                    value={baseAmount}
                    onChange={(event) => setBaseAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
                <div className="col-span-12 md:col-span-6">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {pool.tokenY.symbol} Amount
                  </label>
                  <Input
                    value={quoteAmount}
                    onChange={(event) => setQuoteAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="col-span-12 grid grid-cols-12 gap-2">
                {shapeOptions.map((option) => (
                  <Button
                    key={option.id}
                    type="button"
                    variant="ghost"
                    className={cn(
                      'col-span-4 text-xs',
                      activeShape === option.id ? 'border border-blue text-primary' : 'border border-transparent'
                    )}
                    onClick={() => setActiveShape(option.id)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="col-span-12">
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border/40 px-3 py-2 text-[11px]">
                  <span>Min Price</span>
                  <span className="text-primary">Active Bin</span>
                  <span>Max Price</span>
                </div>
              </div>

              <div className="col-span-12 grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-4">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Min Price</label>
                  <Input
                    value={minPrice}
                    onChange={(event) => setMinPrice(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Max Price</label>
                  <Input
                    value={maxPrice}
                    onChange={(event) => setMaxPrice(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Number of Bins</label>
                  <Input
                    value={bins}
                    onChange={(event) => setBins(event.target.value)}
                    placeholder="5"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="col-span-12">
                <Button type="button" className="w-full text-xs">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Liquidity
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/40 p-4 text-xs text-muted-foreground">
              Remove liquidity controls coming soon for {label}.
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default SarosManage
