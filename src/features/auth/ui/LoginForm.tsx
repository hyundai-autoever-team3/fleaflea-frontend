import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

import { StarField } from '../../../shared/ui/star-field'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  // TODO: 로그인 API 연동 시 setError로 실패 메시지 채우기
  const [error] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // TODO: 로그인 API 연동, 실패 시 setError(...)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle p-6">
      <div className="grid w-full max-w-6xl rounded-3xl bg-bg p-6 shadow-lg md:grid-cols-2 md:gap-8 md:p-10">
        {/* 왼쪽: 폼 */}
        <div className="flex h-full flex-col p-6 md:p-10">
          <div className="flex items-center gap-2">
            <div className="size-8 overflow-hidden rounded-full">
              <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-jua text-body-02 text-text-strong">FleaFlea</span>
          </div>

          <div className="flex flex-1 flex-col justify-center">
            <h1 className="text-head-02 font-bold text-text-strong">로그인</h1>
            <p className="mt-1 text-body-04 text-text-muted">FleaFlea 계정으로 로그인하세요</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
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
                placeholder=" flee@example.com"
                required
                className="h-14 w-full rounded-lg border border-border px-3 text-body-03"
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
                placeholder=" 비밀번호를 입력해 주세요"
                required
                className="h-14 w-full rounded-lg border border-border px-3 pr-10 text-body-03"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeSlashIcon className="size-5" /> : <EyeIcon className="size-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-body-04">
              <label className="flex items-center gap-2 text-text-muted">
                <input type="checkbox" className="size-4 rounded border-border" />
                로그인 상태 유지
              </label>
              <a href="#" className="font-bold text-primary">
                비밀번호를 잊으셨나요?
              </a>
            </div>

            <button
              type="submit"
              className="h-14 rounded-lg bg-primary text-body-03 font-bold text-white"
            >
              로그인
            </button>

            {error && <p className="text-body-04 text-red-600">{error}</p>}

            <p className="text-center text-body-04 text-text-muted">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="font-bold text-primary">
                회원가입
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
          <StarField />
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
