import { useId } from 'react'
import type { ReactNode } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'

interface AccountSettingsModalProps {
  onClose: () => void
  onPasswordChange: () => void
  onWithdraw: () => void
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-text-strong'

// 세 줄이 같은 모양이라야 목록으로 읽힌다. 탈퇴만 색으로 구분한다
function SettingRow({
  glyph,
  title,
  description,
  onClick,
}: {
  glyph: readonly string[]
  title: ReactNode
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ clipPath: pixelBox(3) }}
      className={`group flex min-h-16 w-full items-center gap-3 bg-primary-subtle px-4 py-3 text-left transition-colors hover:bg-primary-tint ${FOCUS_RING}`}
    >
      <span
        style={{ clipPath: pixelBox(2) }}
        className="grid size-9 shrink-0 place-items-center bg-bg text-primary"
      >
        <Sprite rows={glyph} className="w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-04 font-bold text-text-strong">{title}</span>
        <span className="mt-0.5 block text-xs text-text-muted">{description}</span>
      </span>
      <Sprite
        rows={GLYPHS.arrowRight}
        className="w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5"
      />
    </button>
  )
}

export function AccountSettingsModal({ onClose, onPasswordChange, onWithdraw }: AccountSettingsModalProps) {
  const titleId = useId()

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="compact">
      <h2 id={titleId} className="pr-6 text-head-03 font-bold text-text-strong">계정 설정</h2>
      <p className="mt-2 text-body-04 leading-relaxed text-text-muted">로그인과 계정 정보를 관리해요.</p>

      <div className="mt-6 flex flex-col gap-2">
        <SettingRow
          glyph={GLYPHS.lock}
          title="비밀번호 변경"
          description="현재 비밀번호를 새로 바꿔요"
          onClick={onPasswordChange}
        />
      </div>

      {/* 되돌릴 수 없는 동작이라 줄 사이를 띄우고 색을 달리해 손이 잘못 가지 않게 한다 */}
      <div className="mt-5 border-t border-primary-subtle pt-5">
        <SettingRow
          glyph={GLYPHS.trash}
          title="회원 탈퇴"
          description="계정과 거래 기록을 모두 지워요"
          onClick={onWithdraw}
        />
      </div>
    </Modal>
  )
}
