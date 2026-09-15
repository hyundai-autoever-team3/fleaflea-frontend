import { useEffect } from 'react'

import { useToastStore } from '../model/store'

const AUTO_DISMISS_MS = 3000

// AppProviders에 한 번만 마운트. useToastStore.getState().showToast(...)로 어디서든 띄울 수 있음.
export function Toast() {
  const message = useToastStore((state) => state.message)
  const hideToast = useToastStore((state) => state.hideToast)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(hideToast, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [message, hideToast])

  if (!message) return null

  return (
    <div
      role="status"
      data-reveal
      className="is-visible fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-lg bg-text-strong px-5 py-3 text-body-03 font-bold text-white shadow-lg"
    >
      {message}
    </div>
  )
}
