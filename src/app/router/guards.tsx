import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useSessionStore } from '../../entities/session'
import { readRedirect, withRedirect } from '../../shared/lib/redirect'

export function RequireAuth({ children }: { children: ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const location = useLocation()
  // 로그인을 마치면 원래 가려던 화면으로 돌려보낸다
  if (!accessToken) {
    return <Navigate to={withRedirect('/login', `${location.pathname}${location.search}`)} replace />
  }
  return children
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const accessToken = useSessionStore((state) => state.accessToken)
  const redirectTo = readRedirect(useLocation().search)
  // 이미 로그인한 사람이 초대 링크를 거쳐 왔다면 마켓 목록이 아니라 그 링크로 보낸다
  if (accessToken) return <Navigate to={redirectTo ?? '/market'} replace />
  return children
}
