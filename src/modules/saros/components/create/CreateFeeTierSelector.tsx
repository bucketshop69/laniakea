interface FeeTierOption {
  binStep: number
  label: string
  fee: string
}

export const defaultFeeTierOptions: FeeTierOption[] = [
  { binStep: 1, label: '0.01% - Ultra stable', fee: '0.01%' },
  { binStep: 2, label: '0.02% - Very stable', fee: '0.02%' },
  { binStep: 5, label: '0.05% - Stable (Base Fee)', fee: '5%' },
  { binStep: 10, label: '0.10% - Standard', fee: '0.10%' },
  { binStep: 20, label: '0.20% - Medium', fee: '0.20%' },
  { binStep: 50, label: '0.50% - High', fee: '0.50%' },
  { binStep: 100, label: '1.00% - Very high', fee: '1.00%' },
  { binStep: 200, label: '2.00% - Extreme', fee: '2.00%' },
]

interface CreateFeeTierSelectorProps {
  selectedBinStep: number
  onSelect: (binStep: number) => void
  disabled?: boolean
  options?: FeeTierOption[]
}

const CreateFeeTierSelector = ({
  selectedBinStep,
  onSelect,
  disabled = false,
  options = defaultFeeTierOptions,
}: CreateFeeTierSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">Fee Tier (Bin Step)</label>
      <div className="grid grid-cols-12 gap-1">
        {options.map((option) => (
          <label
            key={option.binStep}
            className={`col-span-4 flex items-center gap-2 rounded-lg border p-1 cursor-pointer transition-colors ${selectedBinStep === option.binStep
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              type="radio"
              name="binStep"
              value={option.binStep}
              checked={selectedBinStep === option.binStep}
              onChange={(event) => onSelect(Number(event.target.value))}
              disabled={disabled}
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary truncate">
                {option.label}
              </div>
              <div className="text-xs text-muted-foreground">
                Fee: {option.fee}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default CreateFeeTierSelector
