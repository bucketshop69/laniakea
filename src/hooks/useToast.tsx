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
            toast.type === 'success' && 'border-secondary-foreground/60 bg-secondary/40 text-secondary-foreground',
            toast.type === 'error' && 'border-destructive/60 bg-destructive/10 text-destructive',
            toast.type === 'info' && 'border-accent/60 bg-accent/20 text-secondary-foreground',
            toast.type === 'warning' && 'border-muted-foreground/60 bg-muted/40 text-muted-foreground'
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
