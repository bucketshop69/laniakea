import { ArrowLeft, MinusCircle, PlusCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MeteoraManageTab } from '../../state'

interface ManageHeaderProps {
  onBack: () => void
  label: string
  priceLabel: string
  priceToneClass: string
  activeTab: MeteoraManageTab
  onTabChange: (tab: MeteoraManageTab) => void
  onRefresh: () => void
  isRefreshing?: boolean
}

const ManageHeader = ({
  onBack,
  label,
  priceLabel,
  priceToneClass,
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing = false,
}: ManageHeaderProps) => {
  const tabs: Array<{ id: MeteoraManageTab; label: string; icon: typeof PlusCircle }> = [
    { id: 'add', label: 'Add', icon: PlusCircle },
    { id: 'remove', label: 'Remove', icon: MinusCircle },
  ]

  return (
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
          <span className="leading-none text-sm font-medium text-primary">{label}</span>
          <span className={priceToneClass}>{priceLabel}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh balances and positions"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {tabs.map(({ id, label: tabLabel, icon: Icon }) => {
          const isActive = id === activeTab
          return (
            <Button
              key={id}
              type="button"
              variant="ghost"
              className={`relative h-8 px-3 text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              onClick={() => onTabChange(id)}
            >
              <span className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                {tabLabel}
              </span>
              <span
                className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-transparent'}`}
              ></span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default ManageHeader
