import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MeteoraView } from '../types/domain'

export type MeteoraManageTab = 'add' | 'remove'

export interface MeteoraManageFormState {
  tab: MeteoraManageTab
  baseAmountInput: string
  quoteAmountInput: string
  minBinId: number | null
  maxBinId: number | null
  activeShape: string
}

const createDefaultManageForm = (): MeteoraManageFormState => ({
  tab: 'add',
  baseAmountInput: '',
  quoteAmountInput: '',
  minBinId: null,
  maxBinId: null,
  activeShape: 'spot',
})

interface MeteoraStoreState {
  activeView: MeteoraView
  selectedPairGroup: string | null
  selectedPoolAddress: string | null
  manageForms: Record<string, MeteoraManageFormState>
  setActiveView: (view: MeteoraView) => void
  setSelectedPairGroup: (pairGroup: string | null) => void
  setSelectedPoolAddress: (poolAddress: string | null) => void
  updateManageForm: (poolAddress: string, patch: Partial<MeteoraManageFormState>) => void
  resetManageForm: (poolAddress?: string) => void
}

export const useMeteoraStore = create<MeteoraStoreState>()(
  persist(
    (set) => ({
      activeView: 'discover',
      selectedPairGroup: null,
      selectedPoolAddress: null,
      manageForms: {},
      setActiveView: (view) => set({ activeView: view }),
      setSelectedPairGroup: (pairGroup) => set({ selectedPairGroup: pairGroup }),
      setSelectedPoolAddress: (poolAddress) => set({ selectedPoolAddress: poolAddress }),
      updateManageForm: (poolAddress, patch) => {
        if (!poolAddress) {
          return
        }
        set((state) => {
          const current = state.manageForms[poolAddress] ?? createDefaultManageForm()
          return {
            manageForms: {
              ...state.manageForms,
              [poolAddress]: {
                ...current,
                ...patch,
              },
            },
          }
        })
      },
      resetManageForm: (poolAddress) => {
        if (!poolAddress) {
          set({ manageForms: {} })
          return
        }
        set((state) => ({
          manageForms: {
            ...state.manageForms,
            [poolAddress]: createDefaultManageForm(),
          },
        }))
      },
    }),
    {
      name: 'meteora-ui-store',
      partialize: (state) => ({
        activeView: state.activeView,
        selectedPairGroup: state.selectedPairGroup,
        selectedPoolAddress: state.selectedPoolAddress,
        manageForms: state.manageForms,
      }),
    }
  )
)

export const getDefaultManageForm = createDefaultManageForm
