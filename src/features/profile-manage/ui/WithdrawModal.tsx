import { useId, useState } from 'react'
import { useNavigate } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getWithdrawErrorMessage, useWithdrawMe } from '../api/profile-api'

export function WithdrawModal({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const mutation = useWithdrawMe()

  async function handleWithdraw() {
    setError('')
    try {
      await mutation.mutateAsync()
      // 세션을 지우면 RequireAuth가 막으므로, 로그인 전에도 볼 수 있는 첫 화면으로 보낸다
      useSessionStore.getState().clearSession()
      useToastStore.getState().showToast('탈퇴했어요. 그동안 고마웠어요')
      void navigate('/', { replace: true, viewTransition: true })
    } catch (withdrawError) {
      setError(getWithdrawErrorMessage(withdrawError))
    }
  }

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="sm">
      <div className="py-6 text-center">
        <img src={MASCOTS.surprised} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
        <h2 id={titleId} className="mt-6 text-head-03 font-bold text-text-strong">정말 탈퇴할까요?</h2>
        <p className="mt-2 text-body-04 text-text-muted">
          내 도감과 마켓, 주고받은 거래 기록이 사라져요. 되돌릴 수 없어요.
        </p>

        {error && <p role="alert" className="mt-4 text-body-04 text-red-600">{error}</p>}

        {/* 주요 동작을 왼쪽에. 확인 모달의 취소는 "하지 않겠다"는 답이라 오른쪽 위 X와 중복이 아니다 */}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => void handleWithdraw()}
            disabled={mutation.isPending}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-red-500 py-3 text-body-04 font-bold text-white transition-colors hover:bg-red-600 disabled:bg-red-300"
          >
            {mutation.isPending ? '탈퇴하는 중...' : '탈퇴하기'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </Modal>
  )
}
