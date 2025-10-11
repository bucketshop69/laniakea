import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DriftPositionsState {
  userExists: boolean | null
  userReady: boolean
  userError: string | null
  userAccountPubkey: string | null
  usdcBalance: number | null
  freeCollateral: number | null
  buyingPower: number | null
  leverage: number | null
}

interface DriftPositionsActions {
  setUserExists: (exists: boolean | null) => void
  setUserReady: (ready: boolean) => void
  setUserError: (error: string | null) => void
  setUserAccountPubkey: (pubkey: string | null) => void
  setMetrics: (m: Partial<Pick<DriftPositionsState, 'usdcBalance' | 'freeCollateral' | 'buyingPower' | 'leverage'>>) => void
  reset: () => void
}

export type DriftPositionsStore = DriftPositionsState & DriftPositionsActions

export const useDriftPositionsStore = create<DriftPositionsStore>()(
  devtools((set) => ({
    userExists: null,
    userReady: false,
    userError: null,
    userAccountPubkey: null,
    usdcBalance: null,
    freeCollateral: null,
    buyingPower: null,
    leverage: null,
    setUserExists: (userExists) => set({ userExists }),
    setUserReady: (userReady) => set({ userReady }),
    setUserError: (userError) => set({ userError }),
    setUserAccountPubkey: (userAccountPubkey) => set({ userAccountPubkey }),
    setMetrics: (m) => set((state) => ({ ...state, ...m })),
    reset: () => set({ userExists: null, userReady: false, userError: null, userAccountPubkey: null, usdcBalance: null, freeCollateral: null, buyingPower: null, leverage: null }),
  }))
)
