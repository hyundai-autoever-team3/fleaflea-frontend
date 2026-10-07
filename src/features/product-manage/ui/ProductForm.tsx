import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import type { CollectionItemDetail } from '../../../entities/collection-item'
import { TRADE_TYPE_LABEL, type TradeType } from '../../../entities/product'
import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { MASCOTS } from '../../../shared/config/mascots'
import { shrinkImage } from '../../../shared/lib/image'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import type { CreateProductPayload } from '../api/product-api'
import { CollectionPhoto, CollectionPickerModal } from './CollectionPickerModal'

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
  allowCollectionImport?: boolean
  initialValue?: ProductFormInitialValue
  submitLabel: string
  submittingLabel: string
  onSubmit: (payload: CreateProductPayload) => Promise<void>
  toErrorMessage: (error: unknown) => string
}

// 상품 등록·수정이 함께 쓰는 폼
export function ProductForm({
  allowCollectionImport = false,
  initialValue,
  submitLabel,
  submittingLabel,
  onSubmit,
  toErrorMessage,
}: ProductFormProps) {
  const [title, setTitle] = useState(initialValue?.title ?? '')
  const [description, setDescription] = useState(initialValue?.description ?? '')
  const [tradeType, setTradeType] = useState<TradeType>(initialValue?.tradeType ?? 'SALE')
  const [price, setPrice] = useState(initialValue?.price != null ? String(initialValue.price) : '')
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [collectionItem, setCollectionItem] = useState<CollectionItemDetail | null>(null)
  const imageRequest = useRef(0)
  const busy = isSubmitting || isProcessingImage

  // 판매에만 가격을 입력하며 나눔·대여는 null로 전송한다.
  const needsPrice = tradeType === 'SALE'
  // 새 사진, 불러온 도감 사진, 기존 상품 사진 순으로 표시한다.
  const shownImageUrl = previewUrl ?? collectionItem?.imageUrl ?? initialValue?.imageUrl ?? null

  // 언마운트 후 완료되는 이미지 처리 결과를 무효화한다.
  useEffect(
    () => () => {
      imageRequest.current += 1
    },
    [],
  )

  function applyCollectionItem(item: CollectionItemDetail) {
    // 이전 사진의 압축 결과가 불러온 도감 정보를 덮어쓰지 않도록 한다.
    imageRequest.current += 1
    setIsProcessingImage(false)
    setCollectionItem(item)
    setTitle(item.title)
    setDescription(item.description ?? '')
    selectImage(null)
    setFieldErrors((previous) => ({ ...previous, title: undefined, description: undefined }))
    setError('')
    setPickerOpen(false)
  }

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
    if (!file) return

    if (file && !file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    // 압축 완료 순서가 바뀌어도 가장 최근에 선택한 사진만 반영한다.
    const request = ++imageRequest.current
    setIsProcessingImage(true)

    try {
      const processed = await shrinkImage(file)
      if (request === imageRequest.current) selectImage(processed)
    } finally {
      if (request === imageRequest.current) setIsProcessingImage(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (busy || pickerOpen) return

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    const nextErrors: FieldErrors = {}
    if (!trimmedTitle) nextErrors.title = '상품명을 입력해 주세요.'
    else if (title.length > TITLE_MAX)
      nextErrors.title = `상품명은 ${TITLE_MAX}자 이내로 입력해 주세요.`
    if (!trimmedDescription) nextErrors.description = '상품 설명을 입력해 주세요.'
    else if (description.length > DESCRIPTION_MAX)
      nextErrors.description = `상품 설명은 ${DESCRIPTION_MAX.toLocaleString()}자 이내로 입력해 주세요.`
    // 판매는 1원 이상이어야 하므로 빈 입력과 0원을 각각 검증한다.
    if (needsPrice && !price) nextErrors.price = '판매 가격을 입력해 주세요.'
    else if (needsPrice && Number(price) <= 0) {
      nextErrors.price = '판매 가격은 1원부터 입력할 수 있어요. 그냥 주려면 나눔을 선택해 주세요.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit({
        ...(allowCollectionImport && collectionItem
          ? { collectionItemId: collectionItem.collectionItemId }
          : {}),
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
      {allowCollectionImport && (
        <div style={{ clipPath: pixelBox(4) }} className="bg-primary-subtle p-4 sm:p-5">
          {/* 좁은 화면에서는 불러오기 버튼이 다음 줄로 배치된다. */}
          <div className="flex flex-wrap items-center gap-3">
            <img
              draggable={false}
              src={MASCOTS.basket}
              alt=""
              className="h-12 w-12 shrink-0 object-contain [image-rendering:pixelated]"
            />
            <div className="min-w-[9rem] flex-1">
              <p className="text-body-03 font-bold text-text-strong">
                {collectionItem ? '내 도감과 연결했어요' : '도감에 있는 물건인가요?'}
              </p>
              <p className="mt-1 truncate text-body-04 text-text-muted">
                {collectionItem?.title ?? '이름·설명·사진을 한 번에 가져와요.'}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPickerOpen(true)}
              style={{ clipPath: pixelBox(3) }}
              className="min-h-11 shrink-0 bg-primary px-4 py-2.5 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {collectionItem ? '다른 물건 고르기' : '내 도감에서 불러오기'}
            </button>
          </div>
        </div>
      )}
      <fieldset disabled={busy} className="flex min-w-0 flex-col gap-7">
        <div>
          <span className="text-body-03 font-bold text-text-strong">상품 사진</span>
          {/* 삭제 버튼을 label 밖에 두어 파일 선택 창이 함께 열리지 않게 한다. */}
          <div className="relative mt-2">
            <label
              htmlFor="product-image"
              style={{ clipPath: pixelBox(4) }}
              className="block cursor-pointer bg-primary-tint p-[3px]"
            >
              <div
                style={{ clipPath: pixelBox(4) }}
                className="group relative flex h-52 items-center justify-center overflow-hidden bg-primary-subtle"
              >
                {shownImageUrl ? (
                  <CollectionPhoto imageUrl={shownImageUrl} />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      draggable={false}
                      src={MASCOTS.star}
                      alt=""
                      className="h-16 object-contain [image-rendering:pixelated]"
                    />
                    <span className="text-body-04 font-semibold text-text-muted">
                      눌러서 상품 사진 선택
                    </span>
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
          <input
            id="product-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
          {isProcessingImage && (
            <p role="status" className="mt-2 text-body-04 text-text-muted">
              사진을 준비하는 중이에요...
            </p>
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
          {fieldErrors.title && (
            <p className="mt-2 text-body-04 text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        <div>
          <span className="text-body-03 font-bold text-text-strong">
            거래 유형 <span className="text-primary">*</span>
          </span>
          {/* 선택한 거래 유형은 채움색으로, 나머지는 테두리로 구분한다. */}
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
                    setPrice(
                      event.target.value
                        .replace(/\D/g, '')
                        .replace(/^0+(?=\d)/, '')
                        .slice(0, MAX_PRICE_DIGITS),
                    )
                    setFieldErrors((prev) => ({ ...prev, price: undefined }))
                  }}
                  placeholder="1,000"
                  aria-invalid={Boolean(fieldErrors.price)}
                  style={pixelInputStyle}
                  className={`h-12 pr-10 ${pixelInputClass}`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-03 text-text-muted">
                  원
                </span>
              </div>
            </PixelField>
            {fieldErrors.price && (
              <p className="mt-2 text-body-04 text-red-600">{fieldErrors.price}</p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="product-description"
              className="text-body-03 font-bold text-text-strong"
            >
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
              className={`py-3 ${pixelInputClass}`}
            />
          </PixelField>
          {fieldErrors.description && (
            <p className="mt-2 text-body-04 text-red-600">{fieldErrors.description}</p>
          )}
        </div>
      </fieldset>
      {error && <p className="text-body-04 text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || pickerOpen}
        style={{ clipPath: pixelBox(4) }}
        className="h-14 bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
      >
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
      {allowCollectionImport && pickerOpen && (
        <CollectionPickerModal
          currentItemId={collectionItem?.collectionItemId}
          replacesContent={Boolean(title || description || image || collectionItem)}
          onApply={applyCollectionItem}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </form>
  )
}
