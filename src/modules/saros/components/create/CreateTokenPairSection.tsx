import TokenSelector from '../TokenSelector'
import type { SarosToken } from '../../services/tokenService'

interface CreateTokenPairSectionProps {
  baseToken: SarosToken | null
  quoteToken: SarosToken | null
  onSelectBase: (token: SarosToken) => void
  onSelectQuote: (token: SarosToken) => void
  disabled?: boolean
}

const CreateTokenPairSection = ({
  baseToken,
  quoteToken,
  onSelectBase,
  onSelectQuote,
  disabled = false,
}: CreateTokenPairSectionProps) => {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-6">
        <TokenSelector
          label="Base Token"
          selectedToken={baseToken}
          onSelect={onSelectBase}
          disabled={disabled}
        />
      </div>
      <div className="col-span-6">
        <TokenSelector
          label="Quote Token"
          selectedToken={quoteToken}
          onSelect={onSelectQuote}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default CreateTokenPairSection
