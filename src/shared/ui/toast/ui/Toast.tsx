import { useEffect } from 'react'

import { isStandalone } from '../../../lib/pwa'
import { useToastStore } from '../model/store'

const AUTO_DISMISS_MS = 3000

// AppProviders에서 한 번 마운트하고 전역 스토어의 메시지를 표시한다.
export function Toast() {
  const message = useToastStore((state) => state.message)
  const hideToast = useToastStore((state) => state.hideToast)

  useEffect(() => {
    if (!message) return

    // 메시지가 바뀌면 이전 타이머를 취소하고 표시 시간을 다시 계산한다.
    const timer = setTimeout(hideToast, AUTO_DISMISS_MS)

    return () => clearTimeout(timer)
  }, [message, hideToast])

  if (!message) return null

  return (
    <div
      role="status"
      data-reveal
      // 설치한 앱에서는 하단 탭에 가려지지 않게 그 위로 올린다
      className={`is-visible fixed inset-x-0 z-50 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-lg bg-text-strong px-5 py-3 text-body-03 font-bold text-white shadow-lg ${
        isStandalone() ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : 'bottom-6'
      }`}
    >
      {message}
    </div>
  )
}
