import { create } from 'zustand'

export type ToastType = 'error' | 'warning' | 'success' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    }

    set({ toasts: [...get().toasts, newToast] })

    // Auto-remove after duration
    setTimeout(() => {
      get().removeToast(id)
    }, newToast.duration)

    return id
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },

  clearAll: () => {
    set({ toasts: [] })
  },
}))

// Convenience hooks for common toast types
export const useToast = () => {
  const { addToast, removeToast, clearAll } = useToastStore()

  return {
    error: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration }),
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    remove: removeToast,
    clearAll,
  }
}
