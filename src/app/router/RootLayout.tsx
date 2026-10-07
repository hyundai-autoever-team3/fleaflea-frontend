import { Outlet, ScrollRestoration } from 'react-router'

// 새 경로는 맨 위에서 열고, 뒤로 가기에서는 해당 기록의 스크롤 위치를 복원한다.
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
