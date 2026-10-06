import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { refreshAccessToken, useSessionStore } from '../../../entities/session'
import { consumeOAuthRedirect } from '../../../features/auth'
import { LoadingScreen } from '../../../shared/ui/loading-screen'

// 기존 회원은 백엔드가 리프레시 토큰 쿠키만 심고 돌려보내므로, 재발급으로 접근 토큰을 받아 로그인을 마친다.
export function OAuthSuccessPage() {
  const navigate = useNavigate()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    refreshAccessToken()
      .then((accessToken) => {
        useSessionStore.getState().setSession({ accessToken })
        navigate(consumeOAuthRedirect() ?? '/market', { replace: true, viewTransition: true })
      })
      .catch(() => navigate('/oauth/failure', { replace: true }))
  }, [navigate])

  return <LoadingScreen message="로그인하는 중이에요" />
}
