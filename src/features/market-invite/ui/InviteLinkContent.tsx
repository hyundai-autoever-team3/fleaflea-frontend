import { useState } from 'react'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'

interface InviteLinkContentProps {
  marketTitle: string
  inviteCode: string
  titleId?: string
}

export function InviteLinkContent({ marketTitle, inviteCode, titleId }: InviteLinkContentProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const inviteLink = `${window.location.origin}/invite/${encodeURIComponent(inviteCode)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="text-center">
      <img draggable={false} src={MASCOTS.smile} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
      <h2 id={titleId} className="mt-4 text-head-03 font-bold text-text-strong">
        {marketTitle}
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">친구에게 초대 링크를 보내 마켓을 함께 열어보세요.</p>

      <div className="mt-6 text-left">
        <label htmlFor="invite-link" className="text-body-04 font-bold text-text-strong">
          초대 링크
        </label>
        <input
          id="invite-link"
          value={inviteLink}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
          style={{ clipPath: pixelBox() }}
          className="mt-2 h-12 w-full bg-primary-subtle px-3 text-body-04 text-text-strong outline-none"
        />
      </div>

      <button
        type="button"
        onClick={copyLink}
        style={{ clipPath: pixelBox(4) }}
        className="mt-5 flex h-12 w-full items-center justify-center bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
      >
        초대 링크 복사
      </button>
      <p role="status" className="mt-2 h-5 text-body-04">
        {copyState === 'copied' && <span className="text-primary">✓ 링크를 복사했어요.</span>}
        {copyState === 'failed' && <span className="text-red-600">복사하지 못했어요. 링크를 직접 복사해 주세요.</span>}
      </p>

      <div style={{ clipPath: pixelBox(4) }} className="mt-6 flex items-center gap-3 bg-primary-subtle px-4 py-3 text-left">
        <img draggable={false} src={MASCOTS.star} alt="" className="size-9 shrink-0 object-contain [image-rendering:pixelated]" />
        <div>
          <p className="text-body-04 font-bold text-text-strong">링크를 받은 사람은</p>
          <p className="text-body-04 text-text-muted">로그인 후 마켓 정보를 확인하고 참여할 수 있어요.</p>
        </div>
      </div>
    </div>
  )
}
