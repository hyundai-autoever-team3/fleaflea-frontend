import { api } from '../../../shared/api/axios'

export interface SignupPayload {
  email: string
  password: string
  nickname: string
  // 이메일 인증 코드 확인 응답으로 받은 일회용 토큰. 10분 동안 한 번만 쓸 수 있다
  verificationToken: string
  profileImageUrl?: null
}

export interface LoginPayload {
  email: string
  password: string
}

// 리프레시 토큰은 HttpOnly 쿠키로 관리하므로 응답에는 접근 토큰만 포함한다.
export interface AuthTokens {
  accessToken: string
}

export function signup(payload: SignupPayload) {
  return api.post('/api/v1/auth/signup', payload)
}

export function login(payload: LoginPayload) {
  return api.post('/api/v1/auth/login', payload)
}

export interface PasswordResetPayload {
  email: string
  // PASSWORD_RESET 목적으로 인증 코드를 확인하고 받은 일회용 토큰
  verificationToken: string
  newPassword: string
}

// POST /api/v1/auth/password/reset. 성공하면 204이고 이 브라우저의 리프레시 토큰 쿠키도 지운다
export function resetPassword(payload: PasswordResetPayload) {
  return api.post('/api/v1/auth/password/reset', payload)
}

// 서버 세션과 쿠키를 만료시킨다. 로컬 세션 정리는 호출부에서 처리한다.
export function logout() {
  return api.delete('/api/v1/auth/logout')
}
