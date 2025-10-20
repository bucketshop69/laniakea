import { useMeteoraDataStore, useMeteoraStore } from '../state'
import MeteoraPairGroupsHeatmap from './MeteoraPairGroupsHeatmap'
import MeteoraPositionOverview from './MeteoraPositionOverview'

interface MeteoraStatsProps {
  className?: string
}

export const MeteoraStats = ({ className }: MeteoraStatsProps) => {
  // Get state from stores
  const meteoraState = useMeteoraDataStore((state) => state.data)
  const activeMeteoraPool = meteoraState.selectedPool ?? null
  const meteoraPairGroups = meteoraState.pairGroups
  const meteoraActiveView = useMeteoraStore((state) => state.activeView)

  // Determine view mode: show pool details only on manage view with pool selected
  const shouldShowPoolDetails = meteoraActiveView === 'manage' && activeMeteoraPool !== null

  return (
    <div className={className}>
      {shouldShowPoolDetails ? (
        // Show position overview with its own header
        <div className="overflow-auto max-h-[600px]">
          <MeteoraPositionOverview pool={activeMeteoraPool} />
        </div>
      ) : (
        // Show pair groups heatmap with its own header
        <MeteoraPairGroupsHeatmap
          pairGroups={meteoraPairGroups}
          metric="volume"
          onCardClick={(group) => {
            console.log('[MeteoraStats] Pair group clicked:', group.group_name)
          }}
        />
      )}
    </div>
  )
}

export default MeteoraStats
