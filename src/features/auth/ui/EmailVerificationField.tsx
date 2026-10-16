import { useEffect } from 'react'
import type { RefObject } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

import { EMAIL_PATTERN } from '../../../shared/config/field-limits'
import type { EmailVerification } from '../model/useEmailVerification'
import { CodeInput } from './CodeInput'

interface EmailVerificationFieldProps {
  verification: EmailVerification
  email: string
  onEmailChange: (email: string) => void
  emailInputRef: RefObject<HTMLInputElement | null>
  codeInputRef: RefObject<HTMLInputElement | null>
  // 인증하지 않고 제출했을 때 어디를 고쳐야 하는지 테두리로 알려 준다
  invalid?: boolean
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

// 이메일 입력, 코드 발송, 6자리 코드 확인을 한 묶음으로 보여 준다
export function EmailVerificationField({
  verification,
  email,
  onEmailChange,
  emailInputRef,
  codeInputRef,
  invalid = false,
}: EmailVerificationFieldProps) {
  const { status, sentEmail, code, error, secondsLeft, resendSecondsLeft, expired } = verification
  const verified = status === 'verified'
  const sent = status === 'sent'
  const waitingResend = sent && resendSecondsLeft > 0
  const message = error || (expired ? '인증 시간이 지났어요. 코드를 다시 받아 주세요.' : '')

  // 코드를 보내면 바로 입력할 수 있게 코드 칸으로 옮긴다
  useEffect(() => {
    if (status === 'sent') codeInputRef.current?.focus()
  }, [status, sentEmail, codeInputRef])

  async function handleSend() {
    const value = email.trim()

    if (!EMAIL_PATTERN.test(value)) {
      verification.setError('올바른 이메일 형식이 아니에요.')
      emailInputRef.current?.focus()
      return
    }

    await verification.send(value)
  }

  function handleChangeEmail() {
    verification.reset()
    emailInputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label
            htmlFor="email"
            className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
          >
            이메일
          </label>
          <input
            ref={emailInputRef}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder=" flee@example.com"
            value={email}
            onChange={(event) => {
              onEmailChange(event.target.value)
              // 코드를 보낸 뒤 주소를 고치면 그 코드는 다른 주소의 것이라 처음부터 다시 받는다
              if (sent) verification.reset()
            }}
            readOnly={verified}
            required
            aria-invalid={invalid && status === 'idle'}
            className={`h-14 w-full rounded-lg border px-3 text-body-03 text-text-muted read-only:bg-bg-subtle/40 ${
              invalid && status === 'idle' ? 'border-red-300' : 'border-border'
            }`}
          />
        </div>

        <button
          type="button"
          onClick={verified ? handleChangeEmail : handleSend}
          disabled={verification.isSending || waitingResend}
          className="h-14 w-24 shrink-0 rounded-lg bg-primary-subtle text-body-04 font-bold text-primary transition-colors hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary-subtle"
        >
          {verified
            ? '변경'
            : verification.isSending
              ? '보내는 중'
              : waitingResend
                ? `재발송 ${formatTime(resendSecondsLeft)}`
                : sent
                  ? '재발송'
                  : '인증 요청'}
        </button>
      </div>

      {sent && (
        <div className="flex flex-col gap-3 rounded-lg bg-primary-subtle/60 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="min-w-0 text-body-04 text-text-muted">
              <span className="break-all font-bold text-text-strong">{sentEmail}</span>로 보낸 6자리
              코드를 입력해 주세요.
            </p>
            <span
              className={`shrink-0 text-body-04 font-bold tabular-nums ${
                secondsLeft <= 60 ? 'text-red-600' : 'text-primary'
              }`}
              aria-label={`남은 시간 ${formatTime(secondsLeft)}`}
            >
              {formatTime(secondsLeft)}
            </span>
          </div>

          <CodeInput
            inputRef={codeInputRef}
            value={code}
            onChange={(value) => {
              verification.setCode(value)
              if (error) verification.setError('')
            }}
            onComplete={(value) => void verification.verify(value)}
            invalid={Boolean(error) || invalid}
            disabled={verification.isVerifying || expired}
          />

          <button
            type="button"
            onClick={() => void verification.verify()}
            disabled={verification.isVerifying || expired}
            className="h-12 rounded-lg bg-primary text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verification.isVerifying ? '확인하는 중' : '인증 확인'}
          </button>

          <p className="text-body-04 text-text-muted">
            메일이 오지 않으면 스팸함을 확인하거나 재발송해 주세요.
          </p>
        </div>
      )}

      {verified && (
        <p className="flex items-center gap-1 text-body-04 font-bold text-status-success">
          <CheckCircleIcon className="size-4" aria-hidden="true" />
          이메일 인증을 마쳤어요
        </p>
      )}

      {message && (
        <p role="alert" className="text-body-04 text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
