import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { EMAIL_PATTERN, FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { Modal } from '../../../shared/ui/modal'
import { resetPassword } from '../api/auth-api'
import { useEmailVerification } from '../model/useEmailVerification'
import { EmailCodeStep } from './EmailCodeModal'

interface PasswordResetModalProps {
  open: boolean
  onClose: () => void
  // 바꾼 이메일을 넘겨 로그인 칸에 채울 수 있게 한다
  onDone: (email: string) => void
}

// 로그인 화면에서 여는 비밀번호 찾기 창. 이메일 → 인증 코드 → 새 비밀번호 순서로 한 창 안에서 넘어간다.
// 코드 입력을 또 다른 창으로 띄우면 로그인 창까지 세 겹이 되므로 단계로 바꿔 보여 준다
export function PasswordResetModal({ open, onClose, onDone }: PasswordResetModalProps) {
  const titleId = useId()

  return (
    <Modal open={open} onRequestClose={onClose} labelledBy={titleId} size="sm">
      {/* 창을 다시 열면 Modal이 내용을 새로 그려 처음 단계부터 시작한다 */}
      <PasswordResetContent titleId={titleId} onDone={onDone} />
    </Modal>
  )
}

function getResetErrorMessage(error: unknown) {
  if (isAxiosError<{ code?: string }>(error)) {
    const code = error.response?.data?.code

    if (code === 'SOCIAL_ACCOUNT_PASSWORD_RESET_NOT_ALLOWED')
      return '카카오·구글로 가입한 계정은 비밀번호가 없어요. 간편 로그인으로 들어와 주세요.'
    if (code === 'INVALID_EMAIL_VERIFICATION_TOKEN')
      return '인증 시간이 지났어요. 이메일 인증을 다시 해 주세요.'
    if (error.response?.status === 404) return '가입되지 않은 이메일이에요. 이메일을 확인해 주세요.'
    if (error.response?.status === 400) return '입력한 비밀번호를 다시 확인해 주세요.'
  }

  return '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'
}

// 이 오류는 인증부터 다시 해야 해결된다
function needsNewVerification(error: unknown) {
  if (!isAxiosError<{ code?: string }>(error)) return false

  return (
    error.response?.data?.code === 'INVALID_EMAIL_VERIFICATION_TOKEN' ||
    error.response?.status === 404
  )
}

function PasswordResetContent({
  titleId,
  onDone,
}: {
  titleId: string
  onDone: (email: string) => void
}) {
  const verification = useEmailVerification('PASSWORD_RESET')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = email.trim()

    if (!EMAIL_PATTERN.test(value)) {
      verification.setError('올바른 이메일 형식이 아니에요.')
      return
    }

    await verification.send(value)
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const { min, max } = FIELD_LIMITS.password

    if (password.length < min || password.length > max) {
      setError(`비밀번호는 ${min}~${max}자로 입력해 주세요.`)
      return
    }

    if (/\s/.test(password)) {
      setError('비밀번호에는 공백을 사용할 수 없습니다.')
      return
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await resetPassword({
        email: verification.sentEmail,
        verificationToken: verification.token,
        newPassword: password,
      })
      onDone(verification.sentEmail)
    } catch (resetError) {
      setIsSubmitting(false)

      // 처음 단계로 돌아가면 이 단계의 문구는 사라지므로 이메일 단계에 보여 준다
      if (needsNewVerification(resetError)) {
        verification.reset()
        verification.setError(getResetErrorMessage(resetError))
        return
      }

      setError(getResetErrorMessage(resetError))
    }
  }

  // 처음 단계는 창이 열리는 움직임과 겹치지 않게 그대로 보여 주고, 단계가 바뀔 때만 다음 화면을 밀어 넣는다
  const step = verification.status
  const [prevStep, setPrevStep] = useState(step)
  const [animateStep, setAnimateStep] = useState(false)

  if (step !== prevStep) {
    setPrevStep(step)
    setAnimateStep(true)
  }

  function renderStep() {
    if (verification.status === 'sent') {
      return (
        <>
          <EmailCodeStep verification={verification} titleId={titleId} />
          <button
            type="button"
            onClick={verification.reset}
            className="mx-auto mt-1 block text-xs font-bold text-text-muted underline underline-offset-2 transition-colors hover:text-text-strong"
          >
            다른 이메일로 받기
          </button>
        </>
      )
    }

    if (verification.status === 'verified') {
      return (
        <form onSubmit={handleReset} noValidate className="py-4 text-center">
          <img
            draggable={false}
            src={MASCOTS.wink}
            alt=""
            className="mx-auto h-20 object-contain [image-rendering:pixelated]"
          />

          <h2 id={titleId} className="mt-6 text-head-03 font-bold text-text-strong">
            비밀번호를 재설정해 주세요
          </h2>

          <div className="mt-6 flex flex-col gap-3 text-left">
            <label htmlFor="reset-password" className="text-body-04 font-bold text-text-strong">
              새 비밀번호
            </label>
            <PixelField invalid={Boolean(error)} className="relative -mt-1">
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError('')
                }}
                autoComplete="new-password"
                maxLength={FIELD_LIMITS.password.max}
                placeholder={`${FIELD_LIMITS.password.min}~${FIELD_LIMITS.password.max}자`}
                aria-invalid={Boolean(error)}
                style={pixelInputStyle}
                className={`${pixelInputClass} h-12 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? (
                  <EyeSlashIcon className="size-5" />
                ) : (
                  <EyeIcon className="size-5" />
                )}
              </button>
            </PixelField>

            <label
              htmlFor="reset-password-confirm"
              className="mt-1 text-body-04 font-bold text-text-strong"
            >
              새 비밀번호 확인
            </label>
            <PixelField invalid={Boolean(error)} className="-mt-1">
              <input
                id="reset-password-confirm"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(event) => {
                  setPasswordConfirm(event.target.value)
                  setError('')
                }}
                autoComplete="new-password"
                maxLength={FIELD_LIMITS.password.max}
                placeholder="한 번 더 입력해 주세요"
                aria-invalid={Boolean(error)}
                style={pixelInputStyle}
                className={`${pixelInputClass} h-12`}
              />
            </PixelField>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-left text-body-04 text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ clipPath: pixelBox(4) }}
            className="mt-6 min-h-12 w-full bg-primary py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isSubmitting ? '변경하는 중' : '비밀번호 변경'}
          </button>
        </form>
      )
    }

    return (
      <form onSubmit={handleSend} noValidate className="py-4 text-center">
        <img
          draggable={false}
          src={MASCOTS.surprised}
          alt=""
          className="mx-auto h-20 object-contain [image-rendering:pixelated]"
        />

        <h2 id={titleId} className="mt-6 text-head-03 font-bold text-text-strong">
          비밀번호 찾기
        </h2>
        <p className="mt-2 text-body-04 text-text-muted">
          가입한 이메일로 인증 코드를 보내 드릴게요.
          <br />
          인증하면 새 비밀번호를 정할 수 있어요.
        </p>

        <div className="mt-6 text-left">
          <label htmlFor="reset-email" className="text-body-04 font-bold text-text-strong">
            이메일
          </label>
          <PixelField invalid={Boolean(verification.error)} className="mt-2">
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (verification.error) verification.setError('')
              }}
              autoComplete="email"
              placeholder="flee@example.com"
              aria-invalid={Boolean(verification.error)}
              style={pixelInputStyle}
              className={`${pixelInputClass} h-12`}
            />
          </PixelField>
        </div>

        {verification.error && (
          <p role="alert" className="mt-3 text-left text-body-04 text-red-600">
            {verification.error}
          </p>
        )}

        <button
          type="submit"
          disabled={verification.isSending}
          style={{ clipPath: pixelBox(4) }}
          className="mt-6 min-h-12 w-full bg-primary py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {verification.isSending ? '보내는 중' : '인증 코드 받기'}
        </button>
      </form>
    )
  }

  // key가 바뀌면 새로 그려져 등장 애니메이션이 다시 재생된다
  return (
    <div key={step} data-step-in={animateStep ? '' : undefined}>
      {renderStep()}
    </div>
  )
}
