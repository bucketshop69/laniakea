import { useState, useEffect } from 'react'
import { Loader2, PlusCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { MeteoraBinLiquidityPoint } from '../../services/bins'
import MeteoraBinChart from '../MeteoraBinChart'

interface ShapeOption {
  id: string
  label: string
}

interface AddLiquidityFormProps {
  baseAmountInput: string
  quoteAmountInput: string
  onChangeBaseAmount: (value: string) => void
  onChangeQuoteAmount: (value: string) => void
  baseBalanceLabel: string
  quoteBalanceLabel: string
  shapeOptions: ShapeOption[]
  activeShape: string
  onShapeChange: (shape: string) => void
  baseSymbol: string
  quoteSymbol: string
  // Bin chart props
  binData: MeteoraBinLiquidityPoint[]
  binLoading: boolean
  activeBinId: number | null
  minBinId: number | null
  maxBinId: number | null
  onRangeChange: (minBinId: number, maxBinId: number) => void
  // Price range props
  displayMinPrice: number | null
  displayMaxPrice: number | null
  minPricePercent: number | null
  maxPricePercent: number | null
  numBins: number
  onMinPriceChange: (value: string) => void
  onMaxPriceChange: (value: string) => void
  errorMessage: string | null
  successMessage: string | null
  isConnected: boolean
  onRequestConnect: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isSubmitDisabled: boolean
}

const formatPercentTone = (value: number | null) => {
  if (value === null) return 'text-muted-foreground'
  return value < 0 ? 'text-destructive' : 'text-secondary-foreground'
}

const AddLiquidityForm = ({
  baseAmountInput,
  quoteAmountInput,
  onChangeBaseAmount,
  onChangeQuoteAmount,
  baseBalanceLabel,
  quoteBalanceLabel,
  shapeOptions,
  activeShape,
  onShapeChange,
  baseSymbol,
  quoteSymbol,
  binData,
  binLoading,
  activeBinId,
  minBinId,
  maxBinId,
  onRangeChange,
  displayMinPrice,
  displayMaxPrice,
  minPricePercent,
  maxPricePercent,
  numBins,
  onMinPriceChange,
  onMaxPriceChange,
  errorMessage,
  successMessage,
  isConnected,
  onRequestConnect,
  onSubmit,
  isSubmitting,
  isSubmitDisabled,
}: AddLiquidityFormProps) => {
  // Local state for price inputs to allow free typing
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')

  // Update input values when displayMinPrice/displayMaxPrice change (from brush)
  useEffect(() => {
    if (displayMinPrice !== null && typeof displayMinPrice === 'number') {
      setMinPriceInput(displayMinPrice.toFixed(8))
    }
  }, [displayMinPrice])

  useEffect(() => {
    if (displayMaxPrice !== null && typeof displayMaxPrice === 'number') {
      setMaxPriceInput(displayMaxPrice.toFixed(8))
    }
  }, [displayMaxPrice])

  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-border/40 p-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Input
            value={baseAmountInput}
            onChange={(event) => onChangeBaseAmount(event.target.value)}
            placeholder={`${baseSymbol} 0.00`}
            inputMode="decimal"
            className="h-8 text-xs"
          />
          <span className="text-[10px] text-muted-foreground">{baseBalanceLabel}</span>
        </div>
        <div className="flex flex-col gap-1">
          <Input
            value={quoteAmountInput}
            onChange={(event) => onChangeQuoteAmount(event.target.value)}
            placeholder={`${quoteSymbol} 0.00`}
            inputMode="decimal"
            className="h-8 text-xs"
          />
          <span className="text-[10px] text-muted-foreground">{quoteBalanceLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {shapeOptions.map((option) => (
          <Button
            key={option.id}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 text-xs',
              activeShape === option.id ? 'border border-primary bg-primary/10 text-primary' : 'border border-transparent'
            )}
            onClick={() => onShapeChange(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="relative h-[220px] rounded-lg border border-border/40 bg-card/30 p-2">
        {binLoading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-xs">Loading bins...</span>
          </div>
        ) : binData.length > 0 && activeBinId !== null ? (
          <MeteoraBinChart
            binData={binData}
            activeBinId={activeBinId}
            minBinId={minBinId}
            maxBinId={maxBinId}
            onRangeChange={onRangeChange}
            baseSymbol={baseSymbol}
            quoteSymbol={quoteSymbol}
            maxBinSelection={undefined} // Set to undefined for no limit, or pass a number like 100
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="text-xs">Select a pool to view bin distribution</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Min Price
            {minPricePercent !== null && (
              <span className={`ml-1 ${formatPercentTone(minPricePercent)}`}>
                ({minPricePercent >= 0 ? '+' : ''}{minPricePercent.toFixed(1)}%)
              </span>
            )}
          </label>
          <Input
            type="text"
            value={minPriceInput}
            disabled
            placeholder="Min price"
            className="h-7 bg-muted text-xs"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
            Max Price
            {maxPricePercent !== null && (
              <span className={`ml-1 ${formatPercentTone(maxPricePercent)}`}>
                ({maxPricePercent >= 0 ? '+' : ''}{maxPricePercent.toFixed(1)}%)
              </span>
            )}
          </label>
          <Input
            type="text"
            value={maxPriceInput}
            disabled
            placeholder="Max price"
            className="h-7 bg-muted text-xs"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Bins</label>
          <Input type="text" value={numBins} disabled className="h-7 bg-muted text-center text-xs" />
        </div>
      </div>

      {errorMessage && (
        <Card className="border-red-500/50 bg-red-500/10 p-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-[10px] text-red-500">{errorMessage}</p>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-500/50 bg-green-500/10 p-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-green-500" />
            <p className="text-[10px] text-green-500 break-all">{successMessage}</p>
          </div>
        </Card>
      )}

      {!isConnected ? (
        <Button type="button" size="sm" className="w-full text-xs" onClick={onRequestConnect}>
          Connect Wallet
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          className="w-full text-xs"
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitDisabled}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Adding Liquidity...' : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Liquidity
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default AddLiquidityForm
