import { create } from 'zustand'

interface ToastState {
  message: string | null
  showToast: (message: string) => void
  hideToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  showToast: (message) => set({ message }),
  hideToast: () => set({ message: null }),
}))
