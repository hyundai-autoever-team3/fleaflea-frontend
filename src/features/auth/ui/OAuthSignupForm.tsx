import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { useToastStore } from '../../../shared/ui/toast'
import { completeOAuthSignup } from '../api/oauth-api'
import { consumeOAuthRedirect, getOAuthSignupError } from '../model/oauth'
import { AuthCard } from './AuthCard'

export function OAuthSignupForm() {
  const navigate = useNavigate()

  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [needsRestart, setNeedsRestart] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const value = nickname.trim()
    const { min, max } = FIELD_LIMITS.nickname

    if (value.length < min || value.length > max) {
      setError(`닉네임은 ${min}~${max}자로 입력해 주세요.`)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const { data } = await completeOAuthSignup(value)

      useSessionStore.getState().setSession(data)
      useToastStore.getState().showToast('가입을 환영해요!')

      navigate(consumeOAuthRedirect() ?? '/market', { replace: true, viewTransition: true })
    } catch (signupError) {
      const { message, restart } = getOAuthSignupError(signupError)

      setError(message)
      setNeedsRestart(restart)
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCard
      mascot={MASCOTS.smile}
      title="닉네임을 정해 주세요"
      description="FleaFlea에서 사용할 이름이에요."
    >
      {needsRestart ? (
        <>
          <p className="mt-6 text-body-04 text-red-600">{error}</p>

          <Link
            to="/login"
            replace
            style={{ clipPath: pixelBox(4) }}
            className="mt-6 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
          >
            로그인으로 돌아가기
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 text-left">
          <label htmlFor="oauth-nickname" className="text-body-04 font-bold text-text-strong">
            닉네임
          </label>

          <PixelField invalid={Boolean(error)} className="mt-2">
            <input
              id="oauth-nickname"
              name="nickname"
              value={nickname}
              onChange={(event) => {
                setNickname(event.target.value)
                setError('')
              }}
              maxLength={FIELD_LIMITS.nickname.max}
              placeholder={`${FIELD_LIMITS.nickname.min}~${FIELD_LIMITS.nickname.max}자`}
              autoComplete="nickname"
              aria-invalid={Boolean(error)}
              style={pixelInputStyle}
              className={`${pixelInputClass} h-12`}
            />
          </PixelField>

          {error && <p className="mt-2 text-body-04 text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ clipPath: pixelBox(4) }}
            className="mt-6 h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-primary/50"
          >
            {isSubmitting ? '가입하는 중...' : '시작하기'}
          </button>
        </form>
      )}
    </AuthCard>
  )
}
