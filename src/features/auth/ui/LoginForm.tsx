import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { EMAIL_PATTERN, FIELD_LIMITS } from '../../../shared/config/field-limits'
import { isStandalone } from '../../../shared/lib/pwa'
import { readRedirect, withRedirect } from '../../../shared/lib/redirect'
import { login } from '../api/auth-api'
import { AuthVisual } from './AuthVisual'
import { PasswordResetModal } from './PasswordResetModal'
import { SocialLoginButtons } from './SocialLoginButtons'
import { useSessionStore } from '../../../entities/session'
import { useToastStore } from '../../../shared/ui/toast'

// 모달 안에 넣을 때 넘기는 값. 제목 id는 창 이름으로 쓰고, 로그인·회원가입 전환은 주소를 바꾸지 않고 창 안에서 한다
export interface AuthFormModalOptions {
  titleId: string
  onSwitch: () => void
}

export function LoginForm({ modal }: { modal?: AuthFormModalOptions }) {
  const navigate = useNavigate()
  // 초대 링크처럼 로그인 전에 들어왔던 화면이 있으면 그 자리로 돌려보낸다
  const redirectTo = readRedirect(useLocation().search)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState('')
  const [isResetOpen, setIsResetOpen] = useState(false)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  // 설치한 앱에서는 카드와 옆 그림 없이 흰 화면 가운데에 로고와 폼만 둔다
  const inApp = !modal && isStandalone()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    const nextErrors: typeof fieldErrors = {}
    const { min, max } = FIELD_LIMITS.password
    if (!email) nextErrors.email = '이메일을 입력해 주세요.'
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = '올바른 이메일 형식이 아니에요.'
    if (!password) nextErrors.password = '비밀번호를 입력해 주세요.'
    else if (password.length < min || password.length > max)
      nextErrors.password = `비밀번호는 ${min}~${max}자로 입력해 주세요.`
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      const { data } = await login({ email, password })
      useSessionStore.getState().setSession(data, rememberMe)
      navigate(redirectTo ?? '/market', { replace: true, viewTransition: true })
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <div
      className={
        modal
          ? 'bg-bg'
          : inApp
            ? 'flex min-h-dvh items-center justify-center bg-bg'
            : 'flex min-h-screen items-center justify-center bg-primary-subtle p-6'
      }
    >
      <div
        className={
          modal
            ? 'grid p-8 md:grid-cols-2 md:gap-8'
            : inApp
              ? 'w-full max-w-sm'
              : 'grid w-full max-w-6xl rounded-3xl bg-bg p-6 shadow-lg md:grid-cols-2 md:gap-8 md:p-10'
        }
      >
        {/* 왼쪽: 폼 */}
        <div
          className={`flex h-full flex-col ${modal ? 'p-6' : inApp ? 'px-8 py-10' : 'p-6 md:p-10'}`}
        >
          <div className={inApp ? 'hidden' : 'flex items-center gap-2'}>
            <div className="size-8 overflow-hidden rounded-full">
              <img
                draggable={false}
                src="/mascot/flea.png"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-jua text-body-02 text-text-strong">FleaFlea</span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            {inApp ? (
              // 제목 글자 대신 로고를 가운데에 크게 둔다. 제목은 화면 낭독기용으로만 남긴다
              <>
                <div className="flex flex-col items-center gap-3">
                  <img
                    draggable={false}
                    src="/mascot/flea.png"
                    alt=""
                    className="h-20 object-contain [image-rendering:pixelated]"
                  />
                  <span className="font-jua text-head-01 text-text-strong">FleaFlea</span>
                </div>
                <h1 className="sr-only">로그인</h1>
              </>
            ) : (
              <>
                <h1
                  id={modal?.titleId}
                  className="text-head-02 text-gray-800 font-bold text-text-strong"
                >
                  로그인
                </h1>
                <p className="mt-1 text-body-04 text-text-muted">FleaFlea 계정으로 로그인하세요</p>
              </>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-6">
              <div>
                <div className="relative">
                  <label
                    htmlFor="email"
                    className="absolute -top-2 left-3 bg-bg px-1 text-gray-800 text-body-04 text-text-muted"
                  >
                    이메일
                  </label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="flee@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    className="h-14 w-full rounded-lg border border-border px-3 text-body-03 text-text-muted"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 ml-2 text-body-04 text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
                  >
                    비밀번호
                  </label>
                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    maxLength={FIELD_LIMITS.password.max}
                    placeholder="비밀번호를 입력해 주세요"
                    aria-invalid={Boolean(fieldErrors.password)}
                    className="h-14 w-full rounded-lg border border-border px-3 pr-10 text-body-03"
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
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 ml-2 text-body-04 text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="ml-1 flex items-center gap-2 text-body-04 text-text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  로그인 상태 유지
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-body-04 text-text-muted underline underline-offset-2 transition-colors hover:text-text-strong"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              <button
                type="submit"
                className="h-14 rounded-lg bg-primary text-body-03 font-bold text-white"
              >
                로그인
              </button>

              {error && <p className="text-body-04 text-red-600">{error}</p>}

              <SocialLoginButtons title="간편 로그인" redirectTo={redirectTo} />

              <p className="text-center text-body-04 text-text-muted">
                계정이 없으신가요?{' '}
                {modal ? (
                  <button type="button" onClick={modal.onSwitch} className="font-bold text-primary">
                    회원가입
                  </button>
                ) : (
                  <Link
                    to={redirectTo ? withRedirect('/signup', redirectTo) : '/signup'}
                    className="font-bold text-primary"
                  >
                    회원가입
                  </Link>
                )}
              </p>
            </form>
          </div>
        </div>

        {/* 오른쪽: 큰 카드 안에 여백을 두고 떠있는 별도 비주얼 카드 */}
        {!inApp && <AuthVisual fill={Boolean(modal)} />}
      </div>

      {/* 창 안에 폼이 있어 로그인 폼 바깥에 둔다. form 안에 form을 넣을 수 없다 */}
      <PasswordResetModal
        open={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onDone={(email) => {
          setIsResetOpen(false)
          useToastStore.getState().showToast('비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.')
          // 바꾼 계정으로 바로 로그인할 수 있게 이메일을 채우고 비밀번호 칸으로 옮긴다
          if (emailInputRef.current) emailInputRef.current.value = email
          setError('')
          setFieldErrors({})
          passwordInputRef.current?.focus()
        }}
      />
    </div>
  )
}
