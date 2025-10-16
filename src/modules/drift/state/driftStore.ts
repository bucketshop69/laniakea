import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DriftView = 'discover' | 'trade' | 'overview'

interface DriftStoreState {
  activeView: DriftView
  setActiveView: (view: DriftView) => void
}

export const useDriftStore = create<DriftStoreState>()(
  persist(
    (set) => ({
      activeView: 'discover',
      setActiveView: (view) => set({ activeView: view }),
    }),
    {
      name: 'drift-ui-store',
      partialize: (state) => ({
        activeView: state.activeView,
      }),
    }
  )
)
