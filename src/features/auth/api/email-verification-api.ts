import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'

// 회원가입은 SIGN_UP, 비밀번호 재설정은 PASSWORD_RESET. 발송과 검증에 같은 값을 보내야 한다
export type EmailVerificationPurpose = 'SIGN_UP' | 'PASSWORD_RESET'

export type EmailVerifyResult =
  'SUCCESS' | 'NOT_FOUND' | 'MISMATCH' | 'ATTEMPTS_EXCEED' | 'RATE_LIMIT_EXCEEDED'

// POST /api/v1/auth/email/verify. 실패해도 400·429 응답 body에 같은 모양으로 결과가 온다
export interface EmailVerifyResponse {
  result: EmailVerifyResult
  verificationToken: string | null
}

// POST /api/v1/auth/email/code. 성공하면 204
export function sendEmailCode(email: string, purpose: EmailVerificationPurpose) {
  return api.post('/api/v1/auth/email/code', { email, purpose })
}

export function verifyEmailCode(email: string, purpose: EmailVerificationPurpose, code: string) {
  return api.post<EmailVerifyResponse>('/api/v1/auth/email/verify', { email, purpose, code })
}

export function getSendCodeErrorMessage(error: unknown) {
  if (isAxiosError<{ code?: string }>(error)) {
    const code = error.response?.data?.code

    if (code === 'EMAIL_RESEND_COOLDOWN') return '인증 메일은 60초 후에 다시 보낼 수 있어요.'
    if (code === 'EMAIL_SEND_LIMIT_EXCEEDED')
      return '인증 메일을 너무 여러 번 요청했어요. 1시간 뒤에 다시 시도해 주세요.'
    if (error.response?.status === 400) return '이메일 주소를 다시 확인해 주세요.'
  }

  return '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
}

// 검증 실패는 응답 body의 result로 구분한다. 요청 값 오류(INVALID_REQUEST)는 result가 없다
export function getVerifyResult(error: unknown): EmailVerifyResult | null {
  if (isAxiosError<Partial<EmailVerifyResponse>>(error)) return error.response?.data?.result ?? null

  return null
}

export function getVerifyErrorMessage(result: EmailVerifyResult | null) {
  switch (result) {
    case 'MISMATCH':
      return '인증 코드가 맞지 않아요. 메일을 다시 확인해 주세요.'
    case 'NOT_FOUND':
      return '인증 코드가 만료됐어요. 코드를 다시 받아 주세요.'
    case 'ATTEMPTS_EXCEED':
      return '5번 틀려서 코드가 사라졌어요. 코드를 다시 받아 주세요.'
    case 'RATE_LIMIT_EXCEEDED':
      return '확인 요청이 너무 많아요. 10분 뒤에 다시 시도해 주세요.'
    default:
      return '인증 코드를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
