import { Outlet, useMatch } from 'react-router'

import { isStandalone } from '../../shared/lib/pwa'
import { BottomNav } from '../../widgets/bottom-nav'

// 로그인한 뒤의 화면들이 함께 쓰는 틀. 브라우저 탭에서는 아무것도 더하지 않고,
// 설치한 앱에서는 하단 탭을 붙인 뒤 페이지 맨 아래 내용이 탭에 가려지지 않도록
// 탭 높이(3.5rem + 기기 안전 영역)만큼 여백을 둔다.
export function AppLayout() {
  // 대화방에서는 하단 탭을 내리고 그 자리를 입력창이 쓴다. 채팅 목록(/chat)에는 탭을 그대로 둔다
  const inChatRoom = useMatch('/chat/:roomId') !== null

  if (!isStandalone() || inChatRoom) return <Outlet />

  return (
    <>
      <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  )
}
