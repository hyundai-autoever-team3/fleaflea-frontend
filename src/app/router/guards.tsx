import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useSessionStore } from '../../entities/session'
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
