import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { TRADE_TYPE_LABEL, type ProductSummary, type TradeType } from '../../../entities/product'
import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { createProduct, getCreateProductErrorMessage } from '../api/product-api'

const TITLE_MAX = FIELD_LIMITS.productTitle.max
const DESCRIPTION_MAX = FIELD_LIMITS.productDescription.max
const TRADE_TYPES: TradeType[] = ['SALE', 'GIVEAWAY', 'RENTAL']
const MAX_PRICE_DIGITS = 10

interface FieldErrors {
  title?: string
  description?: string
  price?: string
}

interface CreateProductFormProps {
  marketId: number
  onCreated: (product: ProductSummary) => void
}

export function CreateProductForm({ marketId, onCreated }: CreateProductFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tradeType, setTradeType] = useState<TradeType>('SALE')
  const [price, setPrice] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isGiveaway = tradeType === 'GIVEAWAY'

  // 미리보기 URL이 바뀌거나 페이지를 떠날 때 이전 URL 메모리 해제
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function selectImage(file: File | null) {
    setImage(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    // 같은 파일을 지웠다가 다시 골라도 change가 발생하도록 입력값을 비움
    event.target.value = ''
    if (file && !file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    selectImage(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    const nextErrors: FieldErrors = {}
    if (!trimmedTitle) nextErrors.title = '상품명을 입력해 주세요.'
    if (!trimmedDescription) nextErrors.description = '상품 설명을 입력해 주세요.'
    if (!isGiveaway && !price) nextErrors.price = '가격을 입력해 주세요. 무료라면 나눔을 골라 주세요.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setError('')
    try {
      const { data } = await createProduct(marketId, {
        title: trimmedTitle,
        description: trimmedDescription,
        tradeType,
        price: isGiveaway ? null : Number(price),
        image,
      })
      onCreated(data)
    } catch (createError) {
      setError(getCreateProductErrorMessage(createError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <div>
        <span className="text-body-03 font-bold text-text-strong">상품 사진</span>
        {/* 카드 쇼윈도와 같은 픽셀 테두리 */}
        <label htmlFor="product-image" style={{ clipPath: pixelBox(4) }} className="mt-2 block cursor-pointer bg-primary-tint p-[3px]">
          <div
            style={{ clipPath: pixelBox(4) }}
            className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-primary-subtle"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="선택한 상품 사진 미리보기" className="size-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <img src={MASCOTS.star} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                <span className="text-body-04 font-semibold text-text-muted">눌러서 상품 사진 선택</span>
              </div>
            )}
            {previewUrl && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-body-03 font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                사진 바꾸기
              </span>
            )}
          </div>
        </label>
        <input id="product-image" type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
        {image && (
          <button type="button" onClick={() => selectImage(null)} className="mt-2 text-body-04 text-text-muted underline">
            사진 지우기
          </button>
        )}
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
          거래 방식 <span className="text-primary">*</span>
        </span>
        <div className="mt-2 flex gap-2" role="group" aria-label="거래 방식">
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
                className={`flex-1 py-2.5 text-body-03 font-semibold transition-colors duration-200 ${
                  active
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong'
                }`}
              >
                {TRADE_TYPE_LABEL[type]}
              </button>
            )
          })}
        </div>
      </div>

      {!isGiveaway && (
        <div>
          <label htmlFor="product-price" className="text-body-03 font-bold text-text-strong">
            {tradeType === 'RENTAL' ? '대여 가격' : '판매 가격'} <span className="text-primary">*</span>
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
        {isSubmitting ? '상품 등록하는 중...' : '상품 등록하기'}
      </button>
    </form>
  )
}
