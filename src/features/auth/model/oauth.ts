import { isAxiosError } from 'axios'

import { toSafeRedirect } from '../../../shared/lib/redirect'

// 소셜 로그인은 외부 페이지를 거쳐 돌아오므로, 초대 링크처럼 원래 가려던 경로를 따로 보관한다.
const REDIRECT_KEY = 'oauth-redirect'

export function saveOAuthRedirect(redirectTo: string | null) {
  try {
    if (redirectTo) sessionStorage.setItem(REDIRECT_KEY, redirectTo)
    else sessionStorage.removeItem(REDIRECT_KEY)
  } catch {
    // 저장소를 쓸 수 없으면 로그인 후 기본 화면으로 이동한다.
  }
}

export function consumeOAuthRedirect() {
  try {
    const value = sessionStorage.getItem(REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)

    return toSafeRedirect(value)
  } catch {
    return null
  }
}

const FAILURE_MESSAGE: Record<string, string> = {
  OAUTH2_EMAIL_NOT_FOUND: '이메일 제공에 동의해야 가입할 수 있어요.',
  OAUTH2_EMAIL_NOT_VERIFIED: '인증된 이메일이 있는 계정만 사용할 수 있어요.',
  DUPLICATE_EMAIL: '이미 같은 이메일로 가입한 계정이 있어요. 이메일로 로그인해 주세요.',
  UNSUPPORTED_OAUTH2_PROVIDER: '아직 지원하지 않는 로그인 방식이에요.',
}

export function getOAuthFailureMessage(code: string | null) {
  return (code && FAILURE_MESSAGE[code]) ?? '소셜 로그인에 실패했어요. 다시 시도해 주세요.'
}

// 가입 티켓은 한 번만 쓸 수 있어서, 실패하면 소셜 로그인부터 다시 해야 하는 경우가 많다.
export function getOAuthSignupError(error: unknown): { message: string; restart: boolean } {
  if (isAxiosError<{ code?: string }>(error)) {
    const status = error.response?.status
    const code = error.response?.data?.code

    // 입력 검증은 티켓을 쓰기 전에 끝나므로 닉네임만 고쳐 다시 보내면 된다.
    if (status === 400) return { message: '닉네임을 다시 확인해 주세요.', restart: false }
    if (status === 401)
      return { message: '가입 시간이 지났어요. 소셜 로그인을 다시 해 주세요.', restart: true }
    if (code === 'DUPLICATE_NICKNAME')
      return {
        message:
          '이미 사용 중인 닉네임이에요. 소셜 로그인을 다시 하고 다른 닉네임을 입력해 주세요.',
        restart: true,
      }
    if (code === 'DUPLICATE_EMAIL')
      return {
        message: '이미 같은 이메일로 가입한 계정이 있어요. 이메일로 로그인해 주세요.',
        restart: true,
      }
  }

  return { message: '가입하지 못했어요. 소셜 로그인을 다시 해 주세요.', restart: true }
}
