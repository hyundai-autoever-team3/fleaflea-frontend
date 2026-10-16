import { useEffect, useId, useRef } from 'react'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import type { EmailVerification } from '../model/useEmailVerification'
import { CodeInput } from './CodeInput'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

// 메일로 받은 6자리 코드를 입력하는 창. 회원가입이 모달로 열려 있어도 그 위에 겹쳐 뜬다
export function EmailCodeModal({ verification }: { verification: EmailVerification }) {
  const titleId = useId()

  return (
    <Modal
      open={verification.promptOpen}
      onRequestClose={verification.closePrompt}
      labelledBy={titleId}
      size="sm"
    >
      <EmailCodeContent verification={verification} titleId={titleId} />
    </Modal>
  )
}

function EmailCodeContent({
  verification,
  titleId,
}: {
  verification: EmailVerification
  titleId: string
}) {
  const { sentEmail, code, error, secondsLeft, resendSecondsLeft, expired } = verification
  const codeInputRef = useRef<HTMLInputElement>(null)
  const message = error || (expired ? '인증 시간이 지났어요. 코드를 다시 받아 주세요.' : '')

  // 창이 열리면 바로 입력할 수 있게 코드 칸으로 옮긴다. 다시 보낸 뒤에도 마찬가지다
  useEffect(() => {
    codeInputRef.current?.focus()
  }, [sentEmail, verification.isSending])

  return (
    <div className="py-4 text-center">
      <img
        draggable={false}
        src={MASCOTS.smile}
        alt=""
        className="mx-auto h-20 object-contain [image-rendering:pixelated]"
      />

      <h2 id={titleId} className="mt-6 text-head-03 font-bold text-text-strong">
        메일을 확인해 주세요
      </h2>
      <p className="mt-2 text-body-04 text-text-muted">
        <span className="break-all font-bold text-text-strong">{sentEmail}</span>로 보낸
        <br />
        6자리 코드를 입력해 주세요.
      </p>
      <p
        className={`mt-2 text-body-04 font-bold tabular-nums ${secondsLeft <= 60 ? 'text-red-600' : 'text-primary'}`}
      >
        남은 시간 {formatTime(secondsLeft)}
      </p>

      <div className="mt-6">
        <CodeInput
          inputRef={codeInputRef}
          value={code}
          onChange={(value) => {
            verification.setCode(value)
            if (error) verification.setError('')
          }}
          onComplete={(value) => void verification.verify(value)}
          invalid={Boolean(message)}
          disabled={verification.isVerifying || expired}
        />
      </div>

      <div className="mt-3 flex justify-end">
        {/* 확인보다 덜 쓰는 동작이라 한 단계 작게 둔다. 보낸 뒤 60초 동안은 흐리게 막아 둔다 */}
        <button
          type="button"
          onClick={() => void verification.send(sentEmail)}
          disabled={verification.isSending || resendSecondsLeft > 0}
          className="text-xs font-bold text-text-muted underline underline-offset-2 transition-colors hover:text-text-strong disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
        >
          {verification.isSending ? '보내는 중' : '코드 다시 받기'}
        </button>
      </div>

      {message && (
        <p role="alert" className="mt-3 text-left text-body-04 text-red-600">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() => void verification.verify()}
        disabled={verification.isVerifying || expired}
        style={{ clipPath: pixelBox(4) }}
        className="mt-6 min-h-12 w-full bg-primary py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verification.isVerifying ? '확인하는 중' : '확인'}
      </button>

      <p className="mt-4 text-body-04 text-text-muted">
        메일이 오지 않으면 스팸함도 확인해 주세요.
      </p>
    </div>
  )
}
