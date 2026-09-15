import {useState} from 'react'
import type {FormEvent} from 'react'
import {Link, useNavigate} from 'react-router'
import {isAxiosError} from 'axios'
import {EyeIcon, EyeSlashIcon} from '@heroicons/react/24/outline'

import {EMAIL_PATTERN, FIELD_LIMITS} from '../../../shared/config/field-limits'
import {StarField} from '../../../shared/ui/star-field'
import {useToastStore} from '../../../shared/ui/toast'
import {login, signup} from '../api/auth-api'
import {useSessionStore} from '../../../entities/session'

function getSignupErrorMessage(error: unknown) {
    if (isAxiosError<{ code?: string; message?: string }>(error)) {
        const status = error.response?.status
        const body = error.response?.data
        if (status === 409) {
            if (body?.code === 'DUPLICATE_EMAIL') return '이미 가입된 이메일이에요. 로그인해 주세요.'
            return body?.message ?? '이미 사용 중인 정보예요.'
        }
        if (status === 400) return '입력 정보를 다시 확인해 주세요.'
    }
    return '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'
}

export function SignupForm() {
    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '')
        const nickname = String(formData.get('nickname') ?? '').trim()
        const passwordConfirm = String(formData.get('passwordConfirm') ?? '')

        const {nickname: nicknameLimit, password: passwordLimit} = FIELD_LIMITS

        if (nickname.length < nicknameLimit.min || nickname.length > nicknameLimit.max) {
            setError(`닉네임은 ${nicknameLimit.min}~${nicknameLimit.max}자로 입력해 주세요.`)
            return
        }

        if (!EMAIL_PATTERN.test(email)) {
            setError('올바른 이메일 형식이 아니에요.')
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
            await signup({ email, password, nickname })
        } catch (signupError) {
            setError(getSignupErrorMessage(signupError))
            return
        }

        try {
            // 회원가입 응답엔 토큰이 없어서, 방금 입력한 정보로 바로 로그인까지 이어서 처리
            const { data } = await login({ email, password })
            useSessionStore.getState().setSession(data)
            useToastStore.getState().showToast('가입을 환영해요!')
            navigate('/market', { replace: true })
        } catch {
            // 가입은 이미 끝나서 다시 가입하면 409가 나므로, 자동 로그인만 실패한 경우 로그인 화면으로 안내
            useToastStore.getState().showToast('가입은 완료됐어요. 로그인해 주세요.')
            navigate('/login', { replace: true })
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-6">
            <div className="grid w-full max-w-6xl rounded-3xl bg-bg p-6 shadow-lg md:grid-cols-2 md:gap-8 md:p-10">
                {/* 왼쪽: 폼 */}
                <div className="flex h-full flex-col p-6 md:p-10">
                    <div className="flex items-center gap-2">
                        <div className="size-8 overflow-hidden rounded-full">
                            <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover"/>
                        </div>
                        <span className="font-jua text-body-02 text-text-strong">FleaFlea</span>
                    </div>

                    <div className="flex flex-1 flex-col justify-center">
                        <h1 className="text-head-02 font-bold text-text-strong">회원가입</h1>
                        <p className="mt-1 text-body-04 text-text-muted">FleaFlea 계정을 만들어보세요</p>

                        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
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

                            <div className="relative">
                                <label
                                    htmlFor="email"
                                    className="absolute -top-2 left-3 bg-bg px-1 text-body-04 text-text-muted"
                                >
                                    이메일
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder=" flee@example.com"
                                    required
                                    className="h-14 w-full rounded-lg border border-border px-3 text-body-03 text-text-muted"
                                />
                            </div>

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
                              {/* 비밀 번호가 표기되는 것을 방지할 때*/}
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                >
                                    {showPassword ? <EyeSlashIcon className="size-5"/> : <EyeIcon className="size-5"/>}
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
                              {/* 비밀 번호가 표기되는 것을 방지할 때*/}
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordConfirm((value) => !value)}
                                    aria-label={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 표시'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                >
                                    {showPasswordConfirm ? <EyeSlashIcon className="size-5"/> : <EyeIcon className="size-5"/>}
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="h-14 rounded-lg bg-primary text-body-03 font-bold text-white"
                            >
                                회원가입
                            </button>

                            {error && <p className="text-body-04 text-red-600">{error}</p>}

                            <p className="text-center text-body-04 text-text-muted">
                                이미 계정이 있으신가요?{' '}
                                <Link to="/login" viewTransition className="font-bold text-primary">
                                    로그인
                                </Link>
                            </p>
                        </form>
                    </div>
                </div>

                {/* 오른쪽: 큰 카드 안에 여백을 두고 떠있는 별도 비주얼 카드 */}
                <div className="relative hidden overflow-hidden rounded-2xl bg-cosmic-bg md:block">
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse at 50% 100%, var(--color-cosmic-tint) 0%, transparent 60%), linear-gradient(180deg, var(--color-cosmic-bg), var(--color-cosmic))',
                        }}
                    />
                    <StarField/>
                    <img
                        src="/mascot/flea-bg.png"
                        alt=""
                        className="relative h-full w-full object-cover"
                    />
                </div>
            </div>
        </div>
    )
}
