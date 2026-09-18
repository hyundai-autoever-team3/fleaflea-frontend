import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import { TRADE_TYPE_LABEL, type TradeType } from '../../../entities/product'
import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { shrinkImage } from '../../../shared/lib/image'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import type { CreateProductPayload } from '../api/product-api'

const TITLE_MAX = FIELD_LIMITS.productTitle.max
const DESCRIPTION_MAX = FIELD_LIMITS.productDescription.max
const TRADE_TYPES: TradeType[] = ['SALE', 'GIVEAWAY', 'RENTAL']
const MAX_PRICE_DIGITS = 10

interface FieldErrors {
  title?: string
  description?: string
  price?: string
}

export interface ProductFormInitialValue {
  title: string
  description: string
  tradeType: TradeType
  price: number | null
  imageUrl: string | null
}

interface ProductFormProps {
  initialValue?: ProductFormInitialValue
  submitLabel: string
  submittingLabel: string
  onSubmit: (payload: CreateProductPayload) => Promise<void>
  toErrorMessage: (error: unknown) => string
}

// 상품 등록·수정이 함께 쓰는 폼
export function ProductForm({ initialValue, submitLabel, submittingLabel, onSubmit, toErrorMessage }: ProductFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [tradeType, setTradeType] = useState<TradeType>(initialValue?.tradeType ?? 'SALE')
  const [price, setPrice] = useState(initialValue?.price != null ? String(initialValue.price) : '')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // MVP에서는 대여도 가격을 받지 않음 (대여 기간 설정과 함께 다음 단계에서)
  const needsPrice = tradeType === 'SALE'
  // 새로 고른 사진이 없으면 수정 화면에서는 기존 사진을 보여줌
  const shownImageUrl = previewUrl ?? initialValue?.imageUrl ?? null

  // 미리보기 URL이 바뀌거나 페이지를 떠날 때 이전 URL 메모리 해제
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function selectImage(file: File | null) {
    setImage(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    // 같은 파일을 지웠다가 다시 골라도 change가 발생하도록 입력값을 비움
    event.target.value = ''
    if (file && !file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    // 올리기 전에 줄여서 업로드 실패(413)와 긴 대기를 막음. 사진을 지우는 경우(null)는 그대로 둠
    selectImage(file ? await shrinkImage(file) : null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    const nextErrors: FieldErrors = {}
    if (!trimmedTitle) nextErrors.title = '상품명을 입력해 주세요.'
    if (!trimmedDescription) nextErrors.description = '상품 설명을 입력해 주세요.'
    if (needsPrice && !price) nextErrors.price = '판매 가격을 입력해 주세요.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setError('')
    try {
      await onSubmit({
        title: trimmedTitle,
        description: trimmedDescription,
        tradeType,
        price: needsPrice ? Number(price) : null,
        image,
      })
    } catch (submitError) {
      setError(toErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <div>
        <span className="text-body-03 font-bold text-text-strong">상품 사진</span>
        {/* 지우기 버튼은 label 밖에 둠 — label 안에 있으면 누를 때 파일 선택 창이 같이 열림 */}
        <div className="relative mt-2">
          <label htmlFor="product-image" style={{ clipPath: pixelBox(4) }} className="block cursor-pointer bg-primary-tint p-[3px]">
            <div
              style={{ clipPath: pixelBox(4) }}
              className="group relative flex h-52 items-center justify-center overflow-hidden bg-primary-subtle"
            >
              {shownImageUrl ? (
                <img src={shownImageUrl} alt="선택한 상품 사진 미리보기" className="size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <img src={MASCOTS.star} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
                  <span className="text-body-04 font-semibold text-text-muted">눌러서 상품 사진 선택</span>
                </div>
              )}
              {shownImageUrl && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-body-03 font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  사진 바꾸기
                </span>
              )}
            </div>
          </label>
          {image && (
            <button
              type="button"
              onClick={() => selectImage(null)}
              aria-label="고른 사진 취소"
              style={{ clipPath: pixelBox(2) }}
              className="absolute right-2 top-2 z-10 grid size-6 place-items-center bg-black/40 text-white transition-colors hover:bg-black/60"
            >
              <XMarkIcon className="size-4" />
            </button>
          )}
        </div>
        <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="product-title" className="text-body-03 font-bold text-text-strong">
            상품명 <span className="text-primary">*</span>
          </label>
          <span className="text-body-04 text-text-muted">
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <PixelField invalid={Boolean(fieldErrors.title)} className="mt-2">
          <input
            id="product-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              setFieldErrors((prev) => ({ ...prev, title: undefined }))
            }}
            maxLength={TITLE_MAX}
            placeholder="레트로 필름 카메라"
            aria-invalid={Boolean(fieldErrors.title)}
            style={pixelInputStyle}
            className={`h-12 ${pixelInputClass}`}
          />
        </PixelField>
        {fieldErrors.title && <p className="mt-2 text-body-04 text-red-600">{fieldErrors.title}</p>}
      </div>

      <div>
        <span className="text-body-03 font-bold text-text-strong">
          거래 유형 <span className="text-primary">*</span>
        </span>
        {/* 고르지 않은 칩은 픽셀 테두리 2겹(연보라 판 + 흰 면)으로 윤곽만 남긴다.
            고른 칩만 보라로 채워, 무엇을 골랐는지가 한눈에 보이게 함 */}
        <div className="mt-2 flex gap-2" role="group" aria-label="거래 유형">
          {TRADE_TYPES.map((type) => {
            const active = tradeType === type
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setTradeType(type)
                  setFieldErrors((prev) => ({ ...prev, price: undefined }))
                }}
                style={{ clipPath: pixelBox() }}
                className={
                  active
                    ? 'flex-1 bg-primary p-[2px] transition-colors duration-200'
                    : 'flex-1 bg-primary-tint p-[2px] transition-colors duration-200 hover:bg-primary'
                }
              >
                <span
                  style={{ clipPath: pixelBox() }}
                  className={
                    active
                      ? 'block bg-primary py-2.5 text-body-03 font-semibold text-white'
                      : 'block bg-bg py-2.5 text-body-03 font-semibold text-text-muted'
                  }
                >
                  {TRADE_TYPE_LABEL[type]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {needsPrice && (
        <div>
          <label htmlFor="product-price" className="text-body-03 font-bold text-text-strong">
            판매 가격 <span className="text-primary">*</span>
          </label>
          <PixelField invalid={Boolean(fieldErrors.price)} className="mt-2">
            <div className="relative">
              <input
                id="product-price"
                inputMode="numeric"
                value={price ? Number(price).toLocaleString('ko-KR') : ''}
                onChange={(event) => {
                  setPrice(event.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, MAX_PRICE_DIGITS))
                  setFieldErrors((prev) => ({ ...prev, price: undefined }))
                }}
                placeholder="0"
                aria-invalid={Boolean(fieldErrors.price)}
                style={pixelInputStyle}
                className={`h-12 pr-10 ${pixelInputClass}`}
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-03 text-text-muted">원</span>
            </div>
          </PixelField>
          {fieldErrors.price && <p className="mt-2 text-body-04 text-red-600">{fieldErrors.price}</p>}
        </div>
      )}

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="product-description" className="text-body-03 font-bold text-text-strong">
            상품 설명 <span className="text-primary">*</span>
          </label>
          <span className="text-body-04 text-text-muted">
            {description.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <PixelField invalid={Boolean(fieldErrors.description)} className="mt-2">
          <textarea
            id="product-description"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value)
              setFieldErrors((prev) => ({ ...prev, description: undefined }))
            }}
            maxLength={DESCRIPTION_MAX}
            rows={5}
            placeholder="상품 상태나 거래 방법을 적어 주세요."
            aria-invalid={Boolean(fieldErrors.description)}
            style={pixelInputStyle}
            className={`resize-none py-3 ${pixelInputClass}`}
          />
        </PixelField>
        {fieldErrors.description && <p className="mt-2 text-body-04 text-red-600">{fieldErrors.description}</p>}
      </div>

      {error && <p className="text-body-04 text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ clipPath: pixelBox(4) }}
        className="h-14 bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
