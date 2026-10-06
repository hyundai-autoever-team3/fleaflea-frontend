import { api } from '../../../shared/api/axios'
import { env } from '../../../shared/config/env'
import type { AuthTokens } from './auth-api'

export type SocialProvider = 'kakao' | 'google' | 'naver'

// 인가 요청부터 콜백까지 백엔드가 처리하고, 결과에 따라 /oauth/success·signup·failure로 돌려보낸다.
// 로그인 쿠키가 백엔드 도메인에 설정되므로 이후 요청도 같은 주소(api.defaults.baseURL)로 보내야 한다.
export function getOAuthStartUrl(provider: SocialProvider) {
  return `${env.apiBaseUrl.replace(/\/$/, '')}/oauth2/authorization/${provider}`
}

// 신규 회원은 닉네임을 받아 가입을 마친다. 가입 티켓은 HttpOnly 쿠키로 전송된다.
export function completeOAuthSignup(nickname: string) {
  return api.post<AuthTokens>('/api/v1/auth/oauth2/signup', { nickname })
}
