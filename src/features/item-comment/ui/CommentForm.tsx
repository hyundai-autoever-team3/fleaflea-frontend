import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { COMMENT_MAX_LENGTH } from '../api/item-comment-api'

interface CommentFormProps {
  initialValue?: string
  placeholder: string
  // '등록', '저장'처럼 '…하는 중'을 붙여 읽히는 말
  submitLabel: string
  // 실패하면 오류 문구를 돌려준다. 성공하면 undefined
  onSubmit: (content: string) => Promise<string | undefined>
  onCancel?: () => void
  autoFocus?: boolean
}

// 댓글·답글 작성과 수정에 함께 쓰는 입력 칸
export function CommentForm({
  initialValue = '',
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const content = value.trim()

  useEffect(() => {
    if (!autoFocus) return
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    // 수정할 때는 글 끝에 커서를 둔다
    textarea.setSelectionRange(textarea.value.length, textarea.value.length)
  }, [autoFocus])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content || isSubmitting) return

    setIsSubmitting(true)
    const message = await onSubmit(content)
    setIsSubmitting(false)

    if (message) {
      setError(message)
      return
    }

    // 수정은 창이 닫히므로 비울 필요가 없다
    if (!initialValue) setValue('')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PixelField invalid={Boolean(error)}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError('')
          }}
          onKeyDown={(event) => {
            // 여러 줄을 쓸 수 있게 Enter는 줄바꿈으로 두고, Ctrl·Cmd+Enter로 등록한다
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          rows={2}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-invalid={Boolean(error)}
          style={pixelInputStyle}
          className={`${pixelInputClass} py-3 text-body-04`}
        />
      </PixelField>

      <div className="mt-2 flex items-center justify-end gap-2">
        {error && (
          <p role="alert" className="mr-auto text-body-04 text-red-600">
            {error}
          </p>
        )}
        {value.length > COMMENT_MAX_LENGTH - 200 && (
          <span className="text-xs tabular-nums text-text-muted">
            {value.length}/{COMMENT_MAX_LENGTH}
          </span>
        )}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ clipPath: pixelBox(2) }}
            className="h-9 bg-primary-subtle px-4 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={!content || isSubmitting}
          style={{ clipPath: pixelBox(2) }}
          className="h-9 bg-primary px-4 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-primary/50"
        >
          {isSubmitting ? `${submitLabel}하는 중` : submitLabel}
        </button>
      </div>
    </form>
  )
}
