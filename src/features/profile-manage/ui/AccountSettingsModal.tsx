import { useId } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { Modal } from '../../../shared/ui/modal'

interface AccountSettingsModalProps {
  isLoggingOut: boolean
  onClose: () => void
  onPasswordChange: () => void
  onLogout: () => void
  onWithdraw: () => void
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-text-strong'

export function AccountSettingsModal({
  isLoggingOut,
  onClose,
  onPasswordChange,
  onLogout,
  onWithdraw,
}: AccountSettingsModalProps) {
  const titleId = useId()

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="compact">
      <h2 id={titleId} className="pr-6 text-head-03 font-bold text-text-strong">계정 설정</h2>
      <p className="mt-2 text-body-04 leading-relaxed text-text-muted">로그인과 계정 정보를 관리해요.</p>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={onPasswordChange}
          style={{ clipPath: pixelBox(3) }}
          className={`group flex min-h-16 w-full items-center gap-3 bg-primary-subtle px-4 py-3 text-left transition-colors hover:bg-primary-tint ${FOCUS_RING}`}
        >
          <span className="grid size-9 shrink-0 place-items-center bg-bg" style={{ clipPath: pixelBox(2) }}>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-04 font-bold text-text-strong">비밀번호 변경</span>
            <span className="mt-0.5 block text-xs text-text-muted">현재 비밀번호를 새로 바꿔요</span>
          </span>
          <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          style={{ clipPath: pixelBox(3) }}
          className={`group flex min-h-16 w-full items-center gap-3 bg-primary-subtle px-4 py-3 text-left transition-colors hover:bg-primary-tint disabled:opacity-50 ${FOCUS_RING}`}
        >
          <span className="grid size-9 shrink-0 place-items-center bg-bg" style={{ clipPath: pixelBox(2) }}>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-body-04 font-bold text-text-strong" aria-live="polite">
              {isLoggingOut ? '로그아웃하는 중...' : '로그아웃'}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">이 기기에서 로그인을 종료해요</span>
          </span>
        </button>
      </div>

      <div className="mt-6 border-t border-primary-subtle pt-5">
        <p className="text-xs font-bold text-text-muted">계정 삭제</p>
        <button
          type="button"
          onClick={onWithdraw}
          className={`mt-2 flex min-h-11 items-center gap-2 px-1 text-body-04 text-red-600 transition-colors hover:text-red-700 ${FOCUS_RING}`}
        >
          회원 탈퇴
        </button>
      </div>
    </Modal>
  )
}
