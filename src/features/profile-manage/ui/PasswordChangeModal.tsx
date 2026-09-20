import { useId, useState } from 'react'
import type { FormEvent } from 'react'

import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getPasswordUpdateErrorMessage, useUpdateMyPassword } from '../api/profile-api'

const { min: PASSWORD_MIN, max: PASSWORD_MAX } = FIELD_LIMITS.password

interface FieldErrors {
  currentPassword?: string
  newPassword?: string
  confirmPassword?: string
}

export function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  // 확인 칸은 서버에 보내지 않는다. 오타로 바뀐 비밀번호에 갇히는 일을 막는 용도
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const mutation = useUpdateMyPassword()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mutation.isPending) return

    const nextErrors: FieldErrors = {}
    if (!currentPassword) nextErrors.currentPassword = '현재 비밀번호를 입력해 주세요.'
    if (newPassword.length < PASSWORD_MIN || newPassword.length > PASSWORD_MAX) {
      nextErrors.newPassword = `새 비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자로 지어 주세요.`
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = '지금 쓰는 비밀번호와 달라야 해요.'
    }
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = '새 비밀번호와 달라요.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setError('')
    try {
      await mutation.mutateAsync({ currentPassword, newPassword })
      useToastStore.getState().showToast('비밀번호를 바꿨어요')
      onClose()
    } catch (submitError) {
      setError(getPasswordUpdateErrorMessage(submitError))
    }
  }

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="md">
      <h2 id={titleId} className="pr-5 text-head-03 font-bold text-text-strong">비밀번호 변경</h2>
      <p className="mt-2 text-body-04 text-text-muted">바꾼 뒤에도 로그인은 그대로 유지돼요.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <fieldset disabled={mutation.isPending} className="flex min-w-0 flex-col gap-5">
          {[
            {
              id: 'current-password',
              label: '현재 비밀번호',
              value: currentPassword,
              setValue: setCurrentPassword,
              field: 'currentPassword' as const,
              autoComplete: 'current-password',
            },
            {
              id: 'new-password',
              label: '새 비밀번호',
              value: newPassword,
              setValue: setNewPassword,
              field: 'newPassword' as const,
              autoComplete: 'new-password',
            },
            {
              id: 'confirm-password',
              label: '새 비밀번호 확인',
              value: confirmPassword,
              setValue: setConfirmPassword,
              field: 'confirmPassword' as const,
              autoComplete: 'new-password',
            },
          ].map(({ id, label, value, setValue, field, autoComplete }) => (
            <div key={id}>
              <label htmlFor={id} className="text-body-03 font-bold text-text-strong">
                {label} <span className="text-primary">*</span>
              </label>
              <PixelField invalid={Boolean(fieldErrors[field])} className="mt-2">
                <input
                  id={id}
                  type="password"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value)
                    setFieldErrors((previous) => ({ ...previous, [field]: undefined }))
                  }}
                  maxLength={PASSWORD_MAX}
                  autoComplete={autoComplete}
                  aria-invalid={Boolean(fieldErrors[field])}
                  style={pixelInputStyle}
                  className={`h-12 ${pixelInputClass}`}
                />
              </PixelField>
              {fieldErrors[field] && <p className="mt-2 text-body-04 text-red-600">{fieldErrors[field]}</p>}
            </div>
          ))}
        </fieldset>

        {error && <p role="alert" className="text-body-04 text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-primary/50"
          >
            {mutation.isPending ? '바꾸는 중...' : '변경하기'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong"
          >
            취소
          </button>
        </div>
      </form>
    </Modal>
  )
}
