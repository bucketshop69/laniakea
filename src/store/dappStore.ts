import { create } from 'zustand'

export type SupportedDapp = 'saros' | 'meteora' | 'drift' | 'jupiter'

interface DappStoreState {
  selectedDapp: SupportedDapp
  setSelectedDapp: (dapp: SupportedDapp) => void
}

export const useDappStore = create<DappStoreState>((set) => ({
  selectedDapp: 'meteora',
  setSelectedDapp: (dapp) => set({ selectedDapp: dapp }),
}))
