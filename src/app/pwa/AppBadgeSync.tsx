import { useEffect } from 'react'

import { useUnreadNotificationCount } from '../../entities/notification'
import { useSessionStore } from '../../entities/session'

// 홈 화면 아이콘의 배지를 주어진 숫자로 맞춘다. 0이면 지운다.
// 지원하지 않는 브라우저(안드로이드 크롬 등)에서는 아무 일도 하지 않는다
function setBadge(count: number) {
  if (!('setAppBadge' in navigator)) return

  if (count > 0) void navigator.setAppBadge(count).catch(() => {})
  else void navigator.clearAppBadge().catch(() => {})
}

// 로그인한 동안 안 읽은 알림 개수를 배지로 보여줌
function UnreadBadge() {
  const { data } = useUnreadNotificationCount()
  const count = data?.unreadCount ?? 0

  useEffect(() => {
    setBadge(count)
  }, [count])

  return null
}

export function AppBadgeSync() {
  const isLoggedIn = useSessionStore((state) => Boolean(state.accessToken))

  // 로그아웃하면 남의 눈에 이전 계정의 숫자가 보이지 않게 지움
  useEffect(() => {
    if (!isLoggedIn) setBadge(0)
  }, [isLoggedIn])

  // 로그인 했을 때만 개수를 조회, 로그아웃 상태에서 훅을 부르면 실패하는 요청이 나감
  return isLoggedIn ? <UnreadBadge /> : null
}
