import { Outlet, ScrollRestoration } from 'react-router'

// 화면을 옮길 때마다 스크롤 위치를 기록해 두고, 뒤로 갈 때 그 자리로 되돌린다.
// 새로 여는 화면은 맨 위에서 시작한다 — 이전 화면의 스크롤이 남아
// 상세 화면이 중간부터 보이던 문제도 함께 없어진다
export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
