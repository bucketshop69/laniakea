import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { fetchSarosTokenList, type SarosToken } from '../services/tokenService'

interface TokenSelectorProps {
  label: string
  selectedToken: SarosToken | null
  onSelect: (token: SarosToken) => void
  disabled?: boolean
}

const TokenSelector = ({ label, selectedToken, onSelect, disabled }: TokenSelectorProps) => {
  const [allTokens, setAllTokens] = useState<SarosToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Fetch token list only when dropdown opens
  useEffect(() => {
    if (isOpen && allTokens.length === 0 && !isLoading) {
      setIsLoading(true)
      fetchSarosTokenList()
        .then(setAllTokens)
        .catch((err) => console.error('Failed to fetch tokens:', err))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen, allTokens.length, isLoading])

  // Filter and limit to prevent rendering 6000 items at once
  const filteredTokens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      // No search - show only first 100 tokens to prevent crash
      return allTokens.slice(0, 100)
    }

    // With search - filter and limit to 100 results
    return allTokens
      .filter(
        (token) =>
          token.symbol?.toLowerCase().includes(query) ||
          token.name?.toLowerCase().includes(query) ||
          token.address?.toLowerCase().includes(query)
      )
      .slice(0, 100)
  }, [allTokens, searchQuery])

  const handleSelect = (token: SarosToken) => {
    onSelect(token)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-primary">{label}</label>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedToken ? (
              <div className="flex items-center gap-2">
                {selectedToken.image && (
                  <img
                    src={selectedToken.image}
                    alt={selectedToken.symbol || 'token'}
                    className="h-5 w-5 rounded-full"
                  />
                )}
                <span className="font-medium">{selectedToken.symbol?.toUpperCase() || 'UNKNOWN'}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedToken.name || 'Unknown Token'}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Select token</span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[400px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, symbol, or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 p-0 h-8"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading tokens...
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No tokens found
              </div>
            ) : (
              <>
                {!searchQuery && allTokens.length > 100 && (
                  <div className="p-2 bg-muted/50 text-xs text-muted-foreground text-center border-b">
                    Showing first 100 of {allTokens.length} tokens. Use search to find specific tokens.
                  </div>
                )}
                {filteredTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelect(token)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    {token.image && (
                      <img
                        src={token.image}
                        alt={token.symbol}
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {token.symbol?.toUpperCase() || 'UNKNOWN'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {token.name || 'Unknown Token'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {token.address}
                      </div>
                    </div>
                    {token.current_price && (
                      <div className="text-xs text-muted-foreground">
                        ${parseFloat(token.current_price).toFixed(6)}
                      </div>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default TokenSelector
