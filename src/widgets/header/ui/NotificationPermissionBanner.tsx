import { useState } from 'react'

import { isStandalone } from '../../../shared/lib/pwa'

// 설치한 앱에서 아직 알림 권한을 묻지 않았을 때만 보이는 안내.
// iOS는 알림을 허용한 앱만 아이콘 배지를 쓸 수 있다
export function NotificationPermissionBanner() {
  const supported = 'Notification' in window
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')

  // 이미 허용했거나 거절한 경우에는 재언급 금지
  if (!isStandalone() || permission !== 'default') return null

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-glass-line px-4 py-3">
      <p className="min-w-0 text-xs text-glass-ink/58">
        알림을 허용하면 앱 아이콘에 알림이 표시돼요
      </p>
      <button
        type="button"
        onClick={() => void Notification.requestPermission().then(setPermission)}
        className="shrink-0 whitespace-nowrap text-xs font-bold text-status-brand underline underline-offset-2"
      >
        알림 허용
      </button>
    </div>
  )
}
