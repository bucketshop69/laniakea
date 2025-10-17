import { useMemo } from 'react'
import { Search, User, Droplets } from 'lucide-react'
import { Card } from '@/components/ui/card'
import MeteoraActionRail, { type MeteoraActionDefinition } from './MeteoraActionRail'
import MeteoraDiscover from './MeteoraDiscover'
import { useMeteoraStore, useMeteoraDataStore, type MeteoraView } from '../state'
import type { MeteoraPool } from '@/modules/meteora/types/domain'

const MeteoraAction = () => {
  const setSelectedPool = useMeteoraDataStore((store) => store.setSelectedPool)
  const activeAction = useMeteoraStore((state) => state.activeView)
  const setActiveAction = useMeteoraStore((state) => state.setActiveView)
  const setSelectedPoolAddress = useMeteoraStore((state) => state.setSelectedPoolAddress)

  const actions = useMemo<MeteoraActionDefinition<MeteoraView>[]>(
    () => [
      { id: 'discover', icon: Search, label: 'Discover pools' },
      { id: 'manage', icon: Droplets, label: 'Manage liquidity' },
      { id: 'profile', icon: User, label: 'Profile' },
    ],
    []
  )

  const handlePoolSelect = (pool: MeteoraPool) => {
    setSelectedPool(pool)
    setSelectedPoolAddress(pool.address)
    setActiveAction('manage')
  }

  const handleBackToDiscover = () => {
    setSelectedPool(null)
    setSelectedPoolAddress(null)
    setActiveAction('discover')
  }

  const renderContent = () => {
    switch (activeAction) {
      case 'manage':
        return (
          <Card className="h-full rounded-2xl p-1 overflow-y-auto">
            <div className="p-4 text-center text-muted-foreground">
              Manage view - Coming soon
            </div>
          </Card>
        )
      case 'profile':
        return (
          <Card className="h-full rounded-2xl p-1 overflow-y-auto">
            <div className="p-4 text-center text-muted-foreground">
              Profile view - Coming soon
            </div>
          </Card>
        )
      case 'discover':
      default:
        return (
          <Card className="h-full rounded-2xl p-1">
            <MeteoraDiscover onSelect={handlePoolSelect} />
          </Card>
        )
    }
  }

  return (
    <div className="grid h-full grid-cols-12 gap-1">
      <MeteoraActionRail actions={actions} activeAction={activeAction} onSelect={setActiveAction} />
      <div className="col-span-11 flex flex-col">{renderContent()}</div>
    </div>
  )
}

export default MeteoraAction
