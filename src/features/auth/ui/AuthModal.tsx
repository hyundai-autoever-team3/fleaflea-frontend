import { useId } from 'react'

import { Modal } from '../../../shared/ui/modal'
import { LoginForm } from './LoginForm'
import { SignupForm } from './SignupForm'

export type AuthModalView = 'login' | 'signup'

// 넓은 화면의 웹에서 랜딩 위에 띄우는 로그인·회원가입 창.
// 주소로 직접 들어오거나 초대 링크·로그아웃 뒤에는 바탕 화면이 없으므로 /login·/signup 페이지를 그대로 쓴다
export function AuthModal({
  view,
  onViewChange,
  onClose,
}: {
  view: AuthModalView | null
  onViewChange: (view: AuthModalView) => void
  onClose: () => void
}) {
  const titleId = useId()

  return (
    <Modal open={view !== null} onRequestClose={onClose} labelledBy={titleId} size="xl">
      {view === 'signup' ? (
        <SignupForm modal={{ titleId, onSwitch: () => onViewChange('login') }} />
      ) : (
        <LoginForm modal={{ titleId, onSwitch: () => onViewChange('signup') }} />
      )}
    </Modal>
  )
}
