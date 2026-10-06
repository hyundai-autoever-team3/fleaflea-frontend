import type { ReactNode } from 'react'

import { useToastStore } from '../../../shared/ui/toast'
import { getOAuthStartUrl, type SocialProvider } from '../api/oauth-api'
import { saveOAuthRedirect } from '../model/oauth'

function NaverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#fff" d="M6.5 5h3.7l4 5.9V5h3.3v14h-3.7l-4-5.9V19H6.5z" />
    </svg>
  )
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7">
      <path
        fill="#191919"
        d="M12 5C7.86 5 4.5 7.62 4.5 10.86c0 2.08 1.38 3.9 3.46 4.94l-.7 2.6c-.07.24.2.43.4.29l3.1-2.06c.4.05.82.08 1.24.08 4.14 0 7.5-2.62 7.5-5.85S16.14 5 12 5z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-6">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

const PROVIDERS: {
  provider: SocialProvider
  label: string
  icon: ReactNode
  className: string
  ready: boolean
}[] = [
  {
    provider: 'naver',
    label: '네이버',
    icon: <NaverIcon />,
    className: 'bg-[#03C75A]',
    ready: false,
  },
  {
    provider: 'kakao',
    label: '카카오',
    icon: <KakaoIcon />,
    className: 'bg-[#FEE500]',
    ready: true,
  },
  {
    provider: 'google',
    label: '구글',
    icon: <GoogleIcon />,
    className: 'border border-border bg-white',
    ready: true,
  },
]

export function SocialLoginButtons({
  title,
  redirectTo,
}: {
  title: string
  redirectTo: string | null
}) {
  function start(provider: SocialProvider, label: string, ready: boolean) {
    if (!ready) {
      useToastStore.getState().showToast(`${label} 로그인은 준비 중이에요.`)
      return
    }

    saveOAuthRedirect(redirectTo)

    window.location.assign(getOAuthStartUrl(provider))
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <hr className="flex-1 border-border" />
        <span className="text-body-04 text-text-muted">{title}</span>
        <hr className="flex-1 border-border" />
      </div>

      <div className="mt-5 flex justify-center gap-5">
        {PROVIDERS.map(({ provider, label, icon, className, ready }) => (
          <button
            key={provider}
            type="button"
            onClick={() => start(provider, label, ready)}
            aria-label={`${label}로 시작하기`}
            className={`flex size-12 items-center justify-center rounded-full transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong ${className}`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
