import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useSessionStore } from '../../entities/session'
import { hasSeenOnboarding } from '../../shared/lib/onboarding'
import { isStandalone } from '../../shared/lib/pwa'
import { readRedirect, withRedirect } from '../../shared/lib/redirect'

export function RequireAuth({ children }: { children: ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const location = useLocation()

  // 쿼리 문자열까지 보존해 로그인 후 원래 화면으로 복귀한다.
  if (!accessToken) {
    return (
      <Navigate to={withRedirect('/login', `${location.pathname}${location.search}`)} replace />
    )
  }

  return children
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const redirectTo = readRedirect(useLocation().search)

  // 로그인 상태로 인증 화면에 접근하면 전달받은 내부 경로를 우선한다.
  if (accessToken) return <Navigate to={redirectTo ?? '/market'} replace />

  return children
}

// 설치한 앱을 처음 열었을 때만 로그인보다 소개 화면을 먼저 보여준다.
// 브라우저 탭에서는 랜딩 페이지가 서비스를 소개하므로 거치지 않는다.
export function RequireOnboarded({ children }: { children: ReactNode }) {
  const { search } = useLocation()

  // 로그인 후 돌아갈 주소(?redirect=)를 잃지 않도록 쿼리 문자열을 그대로 넘긴다.
  if (isStandalone() && !hasSeenOnboarding()) {
    return <Navigate to={`/onboarding${search}`} replace />
  }

  return children
}
