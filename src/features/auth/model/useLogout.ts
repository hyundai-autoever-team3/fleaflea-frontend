import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { useToastStore } from '../../../shared/ui/toast'
import { logout } from '../api/auth-api'

// 헤더의 프로필 메뉴(넓은 화면)와 마이페이지(좁은 화면)가 같은 로그아웃 절차를 쓴다.
export function useLogout() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    try {
      await logout()
    } catch {
      // 서버 로그아웃에 실패해도 로컬 세션은 아래에서 삭제한다.
    }

    useSessionStore.getState().clearSession()
    useToastStore.getState().showToast('로그아웃했어요')
    void navigate('/login', { replace: true, viewTransition: true })
  }

  return { isLoggingOut, handleLogout }
}
