import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import { MASCOTS } from '../../../shared/config/mascots'
import { shrinkImage } from '../../../shared/lib/image'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import type { CollectionItemPayload } from '../api/collection-api'

export interface CollectionFormInitialValue {
  title: string
  description: string
  isPublic: boolean
  imageUrl: string | null
}

interface CollectionFormProps {
  initialValue?: CollectionFormInitialValue
  submitLabel: string
  submittingLabel: string
  onSubmit: (payload: CollectionItemPayload) => Promise<void>
  toErrorMessage: (error: unknown) => string
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function CollectionForm({
  initialValue,
  submitLabel,
  submittingLabel,
  onSubmit,
  toErrorMessage,
  onCancel,
  onDirtyChange,
}: CollectionFormProps) {
  const id = useId()
  const [initial] = useState(initialValue)
  const imageInput = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  // 새 물건은 공개가 기본. 스위치를 켜 둔 상태가 공개다
  const [isPublic, setIsPublic] = useState(initialValue?.isPublic ?? true)
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [titleError, setTitleError] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const shownImageUrl = previewUrl ?? initial?.imageUrl ?? null
  const isDirty = title !== (initial?.title ?? '')
    || description !== (initial?.description ?? '')
    || isPublic !== (initial?.isPublic ?? true)
    || image !== null

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function selectImage(file: File | null) {
    setImage(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    // 올리기 전에 줄여서 업로드 실패(413)와 긴 대기를 막음
    selectImage(await shrinkImage(file))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('물건 이름을 입력해 주세요.')
      return
    }

    submitting.current = true
    setIsSubmitting(true)
    setTitleError('')
    setError('')
    try {
      await onSubmit({ title: trimmedTitle, description: description.trim(), isPublic, image })
    } catch (submitError) {
      setError(toErrorMessage(submitError))
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-6">
        <legend className="sr-only">물건 정보</legend>
        <div>
          {/* 공개 설정을 별도 블록으로 두면 자리를 많이 먹어, 사진 라벨과 같은 줄 오른쪽에 붙임.
              조작용 컨트롤이라 픽셀 모서리 대신 둥글게. 손잡이 이동 = 안쪽 폭(40) - 손잡이(20) = 20px */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-body-03 font-bold text-text-strong">물건 사진</span>
            <div className="flex items-center gap-2">
              <span className="text-body-04 font-bold text-text-muted">{isPublic ? '공개' : '비공개'}</span>
              {/* 스위치는 라벨이 가리키는 상태를 켜는 것으로 읽힌다.
                  '공개로 설정'이라 적고 켜짐 = 공개로 맞춰야 헷갈리지 않는다 */}
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label="공개로 설정"
                onClick={() => setIsPublic((current) => !current)}
                className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${
                  isPublic ? 'bg-primary' : 'bg-bg-subtle'
                }`}
              >
                <span
                  className={`block size-5 rounded-full bg-white transition-transform duration-200 motion-reduce:transition-none ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => imageInput.current?.click()}
              aria-label={shownImageUrl ? '물건 사진 바꾸기' : '물건 사진 선택'}
              style={{ clipPath: pixelBox(4) }}
              className="group block w-full bg-primary-tint p-[2px] focus-visible:bg-primary disabled:opacity-60"
            >
              <span
                style={{ clipPath: pixelBox(4) }}
                className="relative flex h-40 items-center justify-center overflow-hidden bg-primary-subtle"
              >
                {shownImageUrl ? (
                  <>
                    <img draggable={false} src={shownImageUrl} alt="물건 사진 미리보기" className="size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/50 py-2 text-body-04 font-semibold text-white">
                      사진 바꾸기
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <img draggable={false} src={MASCOTS.star} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
                    <span className="text-body-04 font-semibold text-text-muted">눌러서 사진 선택</span>
                  </span>
                )}
              </span>
            </button>
            {image && (
              <button
                type="button"
                onClick={() => selectImage(null)}
                aria-label="새로 고른 사진 취소"
                style={{ clipPath: pixelBox(2) }}
                className="absolute right-2 top-2 grid size-8 place-items-center bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60"
              >
                <XMarkIcon aria-hidden="true" className="size-5" />
              </button>
            )}
          </div>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            aria-label="물건 사진 파일"
            tabIndex={-1}
            className="sr-only"
          />
        </div>

        <div>
          <label htmlFor={`${id}-title`} className="text-body-03 font-bold text-text-strong">
            물건 이름 <span className="text-primary">*</span>
          </label>
          <PixelField invalid={Boolean(titleError)} className="mt-2">
            <input
              id={`${id}-title`}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setTitleError('')
              }}
              required
              placeholder="소중한 필름 카메라"
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? `${id}-title-error` : undefined}
              style={pixelInputStyle}
              className={`h-12 disabled:opacity-60 ${pixelInputClass}`}
            />
          </PixelField>
          {titleError && <p id={`${id}-title-error`} role="alert" className="mt-2 text-body-04 text-red-600">{titleError}</p>}
        </div>

        <div>
          <label htmlFor={`${id}-description`} className="text-body-03 font-bold text-text-strong">물건 설명</label>
          <PixelField className="mt-2">
            <textarea
              id={`${id}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="이 물건에 담긴 이야기나 특징을 적어 주세요."
              style={pixelInputStyle}
              className={`py-3 disabled:opacity-60 ${pixelInputClass}`}
            />
          </PixelField>
        </div>

        {error && <p role="alert" className="text-body-04 text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            style={{ clipPath: pixelBox(4) }}
            className="h-12 flex-1 bg-primary px-4 text-body-03 font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-primary/50"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{ clipPath: pixelBox(4) }}
            className="h-12 flex-1 bg-primary-subtle px-4 text-body-03 font-bold text-text-strong transition-colors hover:bg-primary-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            취소
          </button>
        </div>
      </fieldset>
    </form>
  )
}
