import { Input } from '@/components/ui/input'
import type { SarosToken } from '../../services/tokenService'

interface CreatePriceInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  baseToken: SarosToken | null
  quoteToken: SarosToken | null
  isAutoCalculated: boolean
}

const CreatePriceInput = ({
  value,
  onChange,
  disabled = false,
  baseToken,
  quoteToken,
  isAutoCalculated,
}: CreatePriceInputProps) => {
  const baseSymbol = baseToken?.symbol?.toUpperCase() ?? 'BASE'
  const quoteSymbol = quoteToken?.symbol?.toUpperCase() ?? 'QUOTE'
  const basePrice = baseToken?.current_price ? Number.parseFloat(baseToken.current_price) : null
  const quotePrice = quoteToken?.current_price ? Number.parseFloat(quoteToken.current_price) : null

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">
        Initial Price {isAutoCalculated ? '(Auto-calculated - Editable)' : ''}
      </label>
      <Input
        type="number"
        placeholder="Enter price or select tokens to auto-calculate"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        step="0.00000001"
        min="0"
      />
      {baseToken && quoteToken && basePrice !== null && quotePrice !== null && (
        <p className="text-xs text-muted-foreground">
          1 {baseSymbol} = {value || '?'} {quoteSymbol}
          <br />
          Based on current market prices: {baseSymbol} (${basePrice.toFixed(6)}) / {quoteSymbol} (${quotePrice.toFixed(6)})
        </p>
      )}
    </div>
  )
}

export default CreatePriceInput
