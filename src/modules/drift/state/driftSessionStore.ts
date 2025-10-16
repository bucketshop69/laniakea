import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface DriftSessionState {
  clientReady: boolean
  readOnly: boolean
  clientError: string | null
}

interface DriftSessionActions {
  setClientReady: (ready: boolean) => void
  setReadOnly: (readOnly: boolean) => void
  setClientError: (error: string | null) => void
  resetSession: () => void
}

export type DriftSessionStore = DriftSessionState & DriftSessionActions

export const useDriftSessionStore = create<DriftSessionStore>()(
  devtools((set) => ({
    clientReady: false,
    readOnly: true,
    clientError: null,
    setClientReady: (clientReady: boolean) => set({ clientReady }),
    setReadOnly: (readOnly: boolean) => set({ readOnly }),
    setClientError: (clientError: string | null) => set({ clientError }),
    resetSession: () => set({ clientReady: false, readOnly: true, clientError: null }),
  }))
)
