import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LiquidityShape } from '@saros-finance/dlmm-sdk/types/services'
import type { SarosPoolMetadataSnapshot } from '../types/domain'
import type { SarosToken } from '../services/tokenService'

export type SarosView = 'discover' | 'create' | 'manage'
export type SarosManageTab = 'add' | 'remove'

export interface SarosCreateFormState {
  baseToken: SarosToken | null
  quoteToken: SarosToken | null
  selectedBinStep: number
  ratePriceInput: string
}

export interface SarosManageFormState {
  tab: SarosManageTab
  activeShape: LiquidityShape
  baseAmountInput: string
  quoteAmountInput: string
  minBinId: number | null
  maxBinId: number | null
}

const createDefaultCreateForm = (): SarosCreateFormState => ({
  baseToken: null,
  quoteToken: null,
  selectedBinStep: 5,
  ratePriceInput: '',
})

const createDefaultManageForm = (): SarosManageFormState => ({
  tab: 'add',
  activeShape: LiquidityShape.Spot,
  baseAmountInput: '',
  quoteAmountInput: '',
  minBinId: null,
  maxBinId: null,
})

interface SarosStoreState {
  activeView: SarosView
  selectedPoolAddress: string | null
  metadataByPool: Record<string, SarosPoolMetadataSnapshot>
  createForm: SarosCreateFormState
  manageForms: Record<string, SarosManageFormState>
  setActiveView: (view: SarosView) => void
  setSelectedPoolAddress: (poolAddress: string | null) => void
  upsertPoolMetadata: (snapshot: SarosPoolMetadataSnapshot) => void
  clearPoolMetadata: (poolAddress: string) => void
  updateCreateForm: (patch: Partial<SarosCreateFormState>) => void
  resetCreateForm: () => void
  updateManageForm: (poolAddress: string, patch: Partial<SarosManageFormState>) => void
  resetManageForm: (poolAddress?: string) => void
}

export const useSarosStore = create<SarosStoreState>()(
  persist(
    (set) => ({
      activeView: 'discover',
      selectedPoolAddress: null,
      metadataByPool: {},
      createForm: createDefaultCreateForm(),
      manageForms: {},
      setActiveView: (view) => set({ activeView: view }),
      setSelectedPoolAddress: (poolAddress) => set({ selectedPoolAddress: poolAddress }),
      upsertPoolMetadata: (snapshot) => set((state) => ({
        metadataByPool: {
          ...state.metadataByPool,
          [snapshot.poolAddress]: snapshot,
        },
      })),
      clearPoolMetadata: (poolAddress) => set((state) => {
        const next = { ...state.metadataByPool }
        delete next[poolAddress]
        return { metadataByPool: next }
      }),
      updateCreateForm: (patch) => set((state) => ({
        createForm: {
          ...state.createForm,
          ...patch,
        },
      })),
      resetCreateForm: () => set({ createForm: createDefaultCreateForm() }),
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
      name: 'saros-ui-store',
      partialize: (state) => ({
        activeView: state.activeView,
        selectedPoolAddress: state.selectedPoolAddress,
        createForm: state.createForm,
        manageForms: state.manageForms,
      }),
    }
  )
)

export const getDefaultManageForm = createDefaultManageForm
