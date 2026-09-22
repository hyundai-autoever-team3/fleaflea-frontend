import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { shrinkImage } from '../../../shared/lib/image'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { useCreateMarket, type CreateMarketResponse } from '../api/market-api'

const TITLE_MAX = FIELD_LIMITS.marketTitle.max
const DESCRIPTION_MAX = FIELD_LIMITS.marketDescription.max

interface CreateMarketFormProps {
  onCreated: (market: CreateMarketResponse) => void
  onDirtyChange?: (dirty: boolean) => void
}

export function CreateMarketForm({ onCreated, onDirtyChange }: CreateMarketFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [titleError, setTitleError] = useState('')
  const [error, setError] = useState('')
  // 내 마켓 목록 새로고침은 useCreateMarket 안에서 한다
  const createMutation = useCreateMarket()
  const isSubmitting = createMutation.isPending

  const isDirty = Boolean(title || description || coverImage)
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  // 미리보기 URL이 바뀌거나 페이지를 떠날 때 이전 URL 메모리 해제
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function selectCover(file: File | null) {
    setCoverImage(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleCoverChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (file && !file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    // 올리기 전에 줄여서 업로드 실패(413)와 긴 대기를 막음. 커버를 지우는 경우(null)는 그대로 둠
    selectCover(file ? await shrinkImage(file) : null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('마켓 이름을 입력해 주세요.')
      return
    }

    setError('')
    createMutation.mutate(
      {
        title: trimmedTitle,
        description: description.trim() || undefined,
        coverImage,
      },
      {
        onSuccess: onCreated,
        onError: () => setError('마켓을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="market-title" className="text-body-03 font-bold text-text-strong">
            마켓 이름 <span className="text-primary">*</span>
          </label>
          <span className="text-body-04 text-text-muted">
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <PixelField invalid={Boolean(titleError)} className="mt-2">
          <input
            id="market-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setTitleError('')
            }}
            maxLength={TITLE_MAX}
            placeholder="우리 동아리 가을 마켓"
            aria-invalid={Boolean(titleError)}
            style={pixelInputStyle}
            className={`h-12 ${pixelInputClass}`}
          />
        </PixelField>
        {titleError && <p className="mt-2 text-body-04 text-red-600">{titleError}</p>}
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="market-description" className="text-body-03 font-bold text-text-strong">
            마켓 소개
          </label>
          <span className="text-body-04 text-text-muted">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <PixelField className="mt-2">
          <textarea
            id="market-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={DESCRIPTION_MAX}
            rows={4}
            placeholder="서로의 물건에 새로운 주인을 찾아줘요."
            style={pixelInputStyle}
            className={`py-3 ${pixelInputClass}`}
          />
        </PixelField>
      </div>

      <div>
        <span className="text-body-03 font-bold text-text-strong">마켓 커버</span>
        {/* 카드 쇼윈도와 같은 픽셀 테두리 */}
        <label
          htmlFor="market-cover"
          style={{ clipPath: pixelBox(4) }}
          className="mt-2 block cursor-pointer bg-primary-tint p-[3px]"
        >
          <div
            style={{ clipPath: pixelBox(4) }}
            className="group relative flex h-44 items-center justify-center overflow-hidden bg-[image:var(--gradient-dreamy)]"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="선택한 마켓 커버 미리보기" className="size-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <img src={MASCOTS.beret} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                <span className="text-body-04 font-semibold text-text-muted">눌러서 커버 이미지 선택</span>
              </div>
            )}
            {previewUrl && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-body-03 font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                이미지 바꾸기
              </span>
            )}
          </div>
        </label>
        <input id="market-cover" type="file" accept="image/*" onChange={handleCoverChange} className="sr-only" />
        {coverImage && (
          <button
            type="button"
            onClick={() => selectCover(null)}
            className="mt-2 text-body-04 text-text-muted underline"
          >
            커버 이미지 지우기
          </button>
        )}
      </div>

      {error && <p className="text-body-04 text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ clipPath: pixelBox(4) }}
        className="h-14 bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
      >
        {isSubmitting ? '마켓 만드는 중...' : '마켓 만들고 초대하기'}
      </button>
    </form>
  )
}
