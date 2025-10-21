import { create } from 'zustand'
import type { ChartAnnotation, CreateAnnotationParams } from '../types/feedTypes'
import { annotationService } from '../services/annotationService'

/**
 * Annotation store state and actions
 */
interface AnnotationStoreState {
  // State
  annotations: ChartAnnotation[]
  currentAsset: string | null
  currentWalletAddress: string | null
  isLoading: boolean
  error: string | null
  annotationLimit: number

  // Actions
  loadAnnotations: (walletAddress: string, asset: string) => Promise<void>
  addAnnotation: (params: CreateAnnotationParams) => Promise<ChartAnnotation | null>
  deleteAnnotation: (annotationId: string) => Promise<void>
  updateAnnotation: (annotationId: string, newNote: string) => Promise<void>
  clearAnnotations: () => void
  setCurrentAsset: (asset: string | null) => void
  setCurrentWallet: (walletAddress: string | null) => void
  checkCanAddAnnotation: () => Promise<boolean>
  getAnnotationCount: () => number
}

/**
 * Annotation store with Zustand
 * Manages chart annotations for the current user and asset
 */
export const useAnnotationStore = create<AnnotationStoreState>((set, get) => ({
  // Initial state
  annotations: [],
  currentAsset: null,
  currentWalletAddress: null,
  isLoading: false,
  error: null,
  annotationLimit: 10,

  // Load annotations for a specific wallet and asset
  loadAnnotations: async (walletAddress: string, asset: string) => {
    console.log('[AnnotationStore] loadAnnotations called:', { walletAddress, asset })
    set({ isLoading: true, error: null })

    try {
      const annotations = await annotationService.getUserAnnotations(walletAddress, asset)
      console.log('[AnnotationStore] Loaded annotations:', annotations.length, annotations)

      set({
        annotations,
        currentWalletAddress: walletAddress,
        currentAsset: asset,
        isLoading: false,
      })
    } catch (error) {
      console.error('[AnnotationStore] Error loading annotations:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load annotations',
        isLoading: false,
      })
    }
  },

  // Add a new annotation
  addAnnotation: async (params: CreateAnnotationParams) => {
    const { currentWalletAddress, currentAsset, annotationLimit } = get()

    // Set wallet and asset if not already set
    if (!currentWalletAddress) {
      set({
        currentWalletAddress: params.walletAddress,
        currentAsset: params.asset,
      })
    }

    // Check annotation limit
    console.log('[AnnotationStore] Checking annotation limit for:', params.asset)
    const canAdd = await annotationService.canAddAnnotation(
      params.walletAddress,
      params.asset,
      annotationLimit
    )

    if (!canAdd) {
      console.error('[AnnotationStore] Annotation limit reached for', params.asset)
      set({ error: `You have reached the maximum of ${annotationLimit} annotations for this asset` })
      return null
    }

    console.log('[AnnotationStore] Saving annotation:', params.note)
    set({ isLoading: true, error: null })

    try {
      const newAnnotation = await annotationService.saveAnnotation(params)
      console.log('[AnnotationStore] Annotation saved successfully:', newAnnotation.id)

      // Add to store if it's for the current asset
      if (params.asset === currentAsset) {
        set((state) => ({
          annotations: [newAnnotation, ...state.annotations].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ),
          isLoading: false,
        }))
      } else {
        set({ isLoading: false })
      }

      return newAnnotation
    } catch (error) {
      console.error('Error adding annotation:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to add annotation',
        isLoading: false,
      })
      return null
    }
  },

  // Delete an annotation
  deleteAnnotation: async (annotationId: string) => {
    const { currentWalletAddress } = get()

    if (!currentWalletAddress) {
      set({ error: 'Wallet not connected' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      await annotationService.deleteAnnotation(annotationId, currentWalletAddress)

      // Remove from store
      set((state) => ({
        annotations: state.annotations.filter((ann) => ann.id !== annotationId),
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error deleting annotation:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to delete annotation',
        isLoading: false,
      })
    }
  },

  // Update an annotation's note
  updateAnnotation: async (annotationId: string, newNote: string) => {
    const { currentWalletAddress } = get()

    if (!currentWalletAddress) {
      set({ error: 'Wallet not connected' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const updated = await annotationService.updateAnnotation(
        annotationId,
        currentWalletAddress,
        newNote
      )

      // Update in store
      set((state) => ({
        annotations: state.annotations.map((ann) => (ann.id === annotationId ? updated : ann)),
        isLoading: false,
      }))
    } catch (error) {
      console.error('Error updating annotation:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to update annotation',
        isLoading: false,
      })
    }
  },

  // Clear all annotations from state
  clearAnnotations: () => {
    set({
      annotations: [],
      currentAsset: null,
      currentWalletAddress: null,
      error: null,
    })
  },

  // Set current asset (useful for switching charts)
  setCurrentAsset: (asset: string | null) => {
    set({ currentAsset: asset })
  },

  // Set current wallet address
  setCurrentWallet: (walletAddress: string | null) => {
    set({ currentWalletAddress: walletAddress })
  },

  // Check if user can add more annotations
  checkCanAddAnnotation: async () => {
    const { currentWalletAddress, currentAsset, annotationLimit } = get()

    if (!currentWalletAddress || !currentAsset) {
      return false
    }

    return await annotationService.canAddAnnotation(
      currentWalletAddress,
      currentAsset,
      annotationLimit
    )
  },

  // Get current annotation count
  getAnnotationCount: () => {
    return get().annotations.length
  },
}))

/**
 * Selectors for derived state
 */
export const useAnnotations = () => useAnnotationStore((state) => state.annotations)
export const useAnnotationsLoading = () => useAnnotationStore((state) => state.isLoading)
export const useAnnotationsError = () => useAnnotationStore((state) => state.error)
export const useCurrentAsset = () => useAnnotationStore((state) => state.currentAsset)
export const useAnnotationCount = () => useAnnotationStore((state) => state.annotations.length)
export const useCanAddAnnotation = () => {
  const count = useAnnotationStore((state) => state.annotations.length)
  const limit = useAnnotationStore((state) => state.annotationLimit)
  return count < limit
}

/**
 * Get annotations for chart display (limit to 10 most recent)
 */
export const useChartAnnotations = () => {
  const annotations = useAnnotationStore((state) => state.annotations)
  return annotations.slice(0, 10)
}
