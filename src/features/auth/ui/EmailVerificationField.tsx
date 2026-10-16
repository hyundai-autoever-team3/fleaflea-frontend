import type { RefObject } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

import { EMAIL_PATTERN } from '../../../shared/config/field-limits'
import type { EmailVerification } from '../model/useEmailVerification'
import { EmailCodeModal } from './EmailCodeModal'

interface EmailVerificationFieldProps {
  verification: EmailVerification
  email: string
  onEmailChange: (email: string) => void
  emailInputRef: RefObject<HTMLInputElement | null>
  // 인증하지 않고 제출했을 때 이메일 칸 테두리로 알려 준다
  invalid?: boolean
}

// 이메일 칸 옆 버튼으로 코드를 보내고, 코드는 모달에서 입력한다
export function EmailVerificationField({
  verification,
  email,
  onEmailChange,
  emailInputRef,
  invalid = false,
}: EmailVerificationFieldProps) {
  const { status } = verification
  const verified = status === 'verified'
  const sent = status === 'sent'

  async function handleSend() {
    const value = email.trim()

    if (!EMAIL_PATTERN.test(value)) {
      verification.setError('올바른 이메일 형식이 아니에요.')
      emailInputRef.current?.focus()
      return
    }

    await verification.send(value)
  }

  function handleClick() {
    if (verified) {
      verification.reset()
      emailInputRef.current?.focus()
      return
    }

    // 코드를 이미 보냈으면 다시 보내지 않고 입력 창만 연다
    if (sent) {
      verification.openPrompt()
      return
    }

    void handleSend()
  }

  return (
    <div className="flex flex-col gap-2">
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
              else if (verification.error) verification.setError('')
            }}
            readOnly={verified}
            required
            aria-invalid={invalid}
            className={`h-14 w-full rounded-lg border px-3 text-body-03 text-text-muted read-only:bg-bg-subtle/40 ${
              invalid ? 'border-red-300' : 'border-border'
            }`}
          />
        </div>

        {/* 입력칸과 높이를 맞추고, 글자가 바뀌어도 입력칸 너비가 흔들리지 않게 최소 너비를 둔다 */}
        <button
          type="button"
          onClick={handleClick}
          disabled={verification.isSending}
          className="h-14 min-w-[4.5rem] shrink-0 whitespace-nowrap rounded-lg bg-primary-subtle px-3 text-body-04 font-bold text-primary transition-colors hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-60"
        >
          {verified
            ? '변경'
            : verification.isSending
              ? '보내는 중'
              : sent
                ? '코드 입력'
                : '인증 요청'}
        </button>
      </div>

      {verified && (
        <p className="flex items-center gap-1 text-body-04 font-bold text-status-success">
          <CheckCircleIcon className="size-4" aria-hidden="true" />
          이메일 인증을 마쳤어요
        </p>
      )}

      {/* 모달이 닫혀 있을 때만 여기에 보여 준다. 열려 있으면 모달 안에 나온다 */}
      {!verification.promptOpen && verification.error && (
        <p role="alert" className="text-body-04 text-red-600">
          {verification.error}
        </p>
      )}

      <EmailCodeModal verification={verification} />
    </div>
  )
}
