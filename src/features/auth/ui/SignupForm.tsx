import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { isAxiosError } from 'axios'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { EMAIL_PATTERN, FIELD_LIMITS } from '../../../shared/config/field-limits'
import { isStandalone } from '../../../shared/lib/pwa'
import { readRedirect, withRedirect } from '../../../shared/lib/redirect'
import { useToastStore } from '../../../shared/ui/toast'
import { login, signup } from '../api/auth-api'
import { useEmailVerification } from '../model/useEmailVerification'
import { AuthVisual } from './AuthVisual'
import { EmailVerificationField } from './EmailVerificationField'
import type { AuthFormModalOptions } from './LoginForm'
import { SocialLoginButtons } from './SocialLoginButtons'
import { useSessionStore } from '../../../entities/session'

function getSignupErrorMessage(error: unknown) {
  if (isAxiosError<{ code?: string; message?: string }>(error)) {
    const status = error.response?.status
    const body = error.response?.data
    if (status === 409) {
      if (body?.code === 'DUPLICATE_EMAIL') return '이미 가입된 이메일이에요. 로그인해 주세요.'
      return body?.message ?? '이미 사용 중인 정보예요.'
    }
    if (body?.code === 'INVALID_EMAIL_VERIFICATION_TOKEN')
      return '이메일 인증 시간이 지났어요. 이메일 인증을 다시 해 주세요.'
    if (status === 400) return '입력 정보를 다시 확인해 주세요.'
  }
  return '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function SignupForm({ modal }: { modal?: AuthFormModalOptions }) {
  const navigate = useNavigate()
  // 초대 링크처럼 가입 전에 들어왔던 화면이 있으면 그 자리로 돌려보낸다
  const redirectTo = readRedirect(useLocation().search)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  // 인증 없이 가입을 누르면 인증 영역 테두리를 빨갛게 해서 어디를 해야 하는지 보여 준다
  const [verificationMissing, setVerificationMissing] = useState(false)
  const verification = useEmailVerification('SIGN_UP')
  const emailInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setVerificationMissing(false)

    const formData = new FormData(event.currentTarget)
    const trimmedEmail = email.trim()
    const password = String(formData.get('password') ?? '')
    const nickname = String(formData.get('nickname') ?? '').trim()
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '')

    const { nickname: nicknameLimit, password: passwordLimit } = FIELD_LIMITS

    if (nickname.length < nicknameLimit.min || nickname.length > nicknameLimit.max) {
      setError(`닉네임은 ${nicknameLimit.min}~${nicknameLimit.max}자로 입력해 주세요.`)
      return
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('올바른 이메일 형식이 아니에요.')
      return
    }

    // 서버가 인증 토큰 없는 가입을 거절하므로 인증을 마치기 전에는 요청하지 않는다
    if (verification.status !== 'verified' || verification.sentEmail !== trimmedEmail) {
      setVerificationMissing(true)
      if (verification.status === 'sent') {
        setError('메일로 받은 인증 코드를 입력하고 인증 확인을 눌러 주세요.')
        codeInputRef.current?.focus()
      } else {
        setError('이메일 인증을 해야 가입할 수 있어요. 인증 요청을 눌러 주세요.')
        emailInputRef.current?.focus()
      }
      return
    }

    if (password.length < passwordLimit.min || password.length > passwordLimit.max) {
      setError(`비밀번호는 ${passwordLimit.min}~${passwordLimit.max}자로 입력해 주세요.`)
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

    try {
      await signup({
        email: trimmedEmail,
        password,
        nickname,
        verificationToken: verification.token,
      })
    } catch (signupError) {
      setError(getSignupErrorMessage(signupError))
      // 토큰은 한 번만 쓸 수 있고 10분이 지나면 사라지므로, 거절되면 인증부터 다시 받게 한다
      if (
        isAxiosError<{ code?: string }>(signupError) &&
        signupError.response?.data?.code === 'INVALID_EMAIL_VERIFICATION_TOKEN'
      )
        verification.reset()
      return
    }

    try {
      // 회원가입 응답에 토큰이 없으므로 가입 성공 후 별도로 로그인한다.
      const { data } = await login({ email: trimmedEmail, password })
      useSessionStore.getState().setSession(data)
      useToastStore.getState().showToast('가입을 환영해요!')
      navigate(redirectTo ?? '/market', { replace: true, viewTransition: true })
    } catch {
      // 가입은 완료된 상태이므로 로그인만 재시도할 수 있는 화면으로 이동한다.
      useToastStore.getState().showToast('가입은 완료됐어요. 로그인해 주세요.')
      navigate(redirectTo ? withRedirect('/login', redirectTo) : '/login', { replace: true })
    }
  }

  // 인증 안내 문구는 인증을 마치면 더 보여 줄 필요가 없다
  const shownError = verificationMissing && verification.status === 'verified' ? '' : error

  // 설치한 앱에서는 로그인 화면과 같이 카드와 옆 그림 없이 흰 화면 가운데에 로고와 폼만 둔다
  const inApp = !modal && isStandalone()

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
              // 로그인 화면과 같은 자리에 로고를 두고, 어느 화면인지 알 수 있게 제목을 작게 붙인다
              <div className="flex flex-col items-center">
                <img
                  draggable={false}
                  src="/mascot/flea.png"
                  alt=""
                  className="h-16 object-contain [image-rendering:pixelated]"
                />
                <span className="mt-2 font-jua text-head-03 text-text-strong">FleaFlea</span>
                <h1 className="mt-3 text-body-03 font-bold text-text-muted">회원가입</h1>
              </div>
            ) : (
              <>
                <h1 id={modal?.titleId} className="text-head-02 font-bold text-text-strong">
                  회원가입
                </h1>
                <p className="mt-1 text-body-04 text-text-muted">FleaFlea 계정을 만들어보세요</p>
              </>
            )}

            <form
              onSubmit={handleSubmit}
              className={`flex flex-col ${inApp || modal ? 'mt-6 gap-5' : 'mt-8 gap-6'}`}
            >
              <div className="relative">
                <label
                  htmlFor="nickname"
                  className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
                >
                  닉네임
                </label>
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  autoComplete="username"
                  maxLength={FIELD_LIMITS.nickname.max}
                  placeholder=" 서비스에서 사용할 닉네임 (2~20자)"
                  required
                  className="h-14 w-full rounded-lg border border-border px-3 text-body-03 text-text-muted"
                />
              </div>

              <EmailVerificationField
                verification={verification}
                email={email}
                onEmailChange={setEmail}
                emailInputRef={emailInputRef}
                codeInputRef={codeInputRef}
                invalid={verificationMissing && verification.status !== 'verified'}
              />

              <div className="relative">
                <label
                  htmlFor="password"
                  className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={FIELD_LIMITS.password.max}
                  placeholder=" 비밀번호를 입력해 주세요 (8~20자)"
                  required
                  className="h-14 w-full rounded-lg border border-border px-3 pr-10 text-body-03 text-text-muted"
                />
                {/* 비밀번호 표시 상태에 맞는 아이콘을 사용한다. */}
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

              <div className="relative">
                <label
                  htmlFor="passwordConfirm"
                  className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
                >
                  비밀번호 확인
                </label>
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  maxLength={FIELD_LIMITS.password.max}
                  placeholder=" 비밀번호를 다시 입력해 주세요"
                  required
                  className="h-14 w-full rounded-lg border border-border px-3 pr-10 text-body-03 text-text-muted"
                />
                {/* 비밀번호 표시 상태에 맞는 아이콘을 사용한다. */}
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((value) => !value)}
                  aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 표시'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  {showPasswordConfirm ? (
                    <EyeSlashIcon className="size-5" />
                  ) : (
                    <EyeIcon className="size-5" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="h-14 rounded-lg bg-primary text-body-03 font-bold text-white"
              >
                회원가입
              </button>

              {shownError && (
                <p role="alert" className="text-body-04 text-red-600">
                  {shownError}
                </p>
              )}

              <SocialLoginButtons title="간편 회원가입" redirectTo={redirectTo} />

              <p className="text-center text-body-04 text-text-muted">
                이미 계정이 있으신가요?{' '}
                {modal ? (
                  <button type="button" onClick={modal.onSwitch} className="font-bold text-primary">
                    로그인
                  </button>
                ) : (
                  <Link
                    to={redirectTo ? withRedirect('/login', redirectTo) : '/login'}
                    viewTransition
                    className="font-bold text-primary"
                  >
                    로그인
                  </Link>
                )}
              </p>
            </form>
          </div>
        </div>

        {/* 오른쪽: 큰 카드 안에 여백을 두고 떠있는 별도 비주얼 카드 */}
        {!inApp && <AuthVisual fill={Boolean(modal)} />}
      </div>
    </div>
  )
}
