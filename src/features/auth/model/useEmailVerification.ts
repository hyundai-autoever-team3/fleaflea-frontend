import { useEffect, useState } from 'react'

import {
  getSendCodeErrorMessage,
  getVerifyErrorMessage,
  getVerifyResult,
  sendEmailCode,
  verifyEmailCode,
} from '../api/email-verification-api'
import type { EmailVerificationPurpose } from '../api/email-verification-api'

// 백엔드 규칙: 코드는 5분 동안 유효하고, 같은 이메일은 60초 뒤에 다시 보낼 수 있다
const CODE_TTL_MS = 5 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
export const CODE_LENGTH = 6

export type EmailVerificationStatus = 'idle' | 'sent' | 'verified'

export function useEmailVerification(purpose: EmailVerificationPurpose) {
  const [status, setStatus] = useState<EmailVerificationStatus>('idle')
  // 코드를 보낸 이메일. 검증과 가입 요청에 이 값을 그대로 쓴다
  const [sentEmail, setSentEmail] = useState('')
  const [code, setCode] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'send' | 'verify' | null>(null)
  const [expiresAt, setExpiresAt] = useState(0)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(0)
  // 코드 입력 모달. 코드를 보내면 열리고 인증하면 닫힌다
  const [promptOpen, setPromptOpen] = useState(false)

  // 코드를 기다리는 동안만 1초마다 남은 시간을 갱신한다
  useEffect(() => {
    if (status !== 'sent') return

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const resendSecondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const expired = status === 'sent' && secondsLeft === 0

  async function send(email: string) {
    setPending('send')
    setError('')

    try {
      await sendEmailCode(email, purpose)

      const sentAt = Date.now()
      setStatus('sent')
      setSentEmail(email)
      setCode('')
      setExpiresAt(sentAt + CODE_TTL_MS)
      setResendAt(sentAt + RESEND_COOLDOWN_MS)
      setNow(sentAt)
      setPromptOpen(true)
      return true
    } catch (sendError) {
      setError(getSendCodeErrorMessage(sendError))
      return false
    } finally {
      setPending(null)
    }
  }

  async function verify(value = code) {
    if (pending) return

    if (value.length < CODE_LENGTH) {
      setError('메일로 받은 6자리 코드를 모두 입력해 주세요.')
      return
    }

    if (expired) {
      setError('인증 코드가 만료됐어요. 코드를 다시 받아 주세요.')
      return
    }

    setPending('verify')
    setError('')

    try {
      const { data } = await verifyEmailCode(sentEmail, purpose, value)

      setStatus('verified')
      setToken(data.verificationToken ?? '')
      setPromptOpen(false)
    } catch (verifyError) {
      setError(getVerifyErrorMessage(getVerifyResult(verifyError)))
    } finally {
      setPending(null)
    }
  }

  // 이메일을 바꾸면 이전 인증은 쓸 수 없으므로 처음 상태로 되돌린다
  function reset() {
    setStatus('idle')
    setSentEmail('')
    setCode('')
    setToken('')
    setError('')
    setExpiresAt(0)
    setResendAt(0)
    setPromptOpen(false)
  }

  function openPrompt() {
    setError('')
    setPromptOpen(true)
  }

  // 닫으면 모달 안의 오류는 더 보이지 않으므로 지운다. 입력한 코드는 다시 열 때를 위해 남긴다
  function closePrompt() {
    setError('')
    setPromptOpen(false)
  }

  return {
    status,
    sentEmail,
    code,
    setCode,
    token,
    error,
    setError,
    isSending: pending === 'send',
    isVerifying: pending === 'verify',
    secondsLeft,
    resendSecondsLeft,
    expired,
    promptOpen,
    openPrompt,
    closePrompt,
    send,
    verify,
    reset,
  }
}

export type EmailVerification = ReturnType<typeof useEmailVerification>
