import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'
type Toast = { id: number; message: string; type: ToastType }

let toastIdCounter = 0

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = toastIdCounter++
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, showToast, dismissToast }
}

export const ToastContainer = ({ toasts }: { toasts: Toast[] }) => {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right duration-300',
            toast.type === 'success' && 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
            toast.type === 'error' && 'border-red-500/50 bg-red-500/10 text-red-400',
            toast.type === 'info' && 'border-blue-500/50 bg-blue-500/10 text-blue-400',
            toast.type === 'warning' && 'border-amber-500/50 bg-amber-500/10 text-amber-400'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
