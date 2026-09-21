import { useId, useState } from 'react'

import { REQUEST_ACTION_LABEL, type TradeType } from '../../../entities/product'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getTradeRequestErrorMessage, useCreateTradeRequest } from '../api/trade-request-api'

interface ProductTradeRequestModalProps {
  open: boolean
  itemId: number
  itemTitle: string
  tradeType: TradeType
  onClose: () => void
}

const MESSAGE_MAX = 500

// 오늘 이전 날짜를 고르지 못하게 min으로 막는다
function todayString() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function ProductTradeRequestModal({
  open,
  itemId,
  itemTitle,
  tradeType,
  onClose,
}: ProductTradeRequestModalProps) {
  const id = useId()
  const [message, setMessage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState('')
  const mutation = useCreateTradeRequest(itemId)

  // 대여만 기간을 받는다. 판매·나눔은 날짜 개념이 없음
  const needsDates = tradeType === 'RENTAL'
  // 보내는 사람 입장의 이름을 쓴다 — 파는 물건이라도 누르는 쪽은 '구매'다
  const label = REQUEST_ACTION_LABEL[tradeType]

  function close() {
    setMessage('')
    setStartDate('')
    setEndDate('')
    setError('')
    onClose()
  }

  async function handleSubmit() {
    if (needsDates) {
      if (!startDate || !endDate) {
        setError('대여 시작일과 종료일을 골라 주세요.')
        return
      }
      if (startDate > endDate) {
        setError('종료일은 시작일과 같거나 뒤여야 해요.')
        return
      }
    }

    setError('')
    const trimmed = message.trim()
    try {
      await mutation.mutateAsync({
        message: trimmed || undefined,
        rentalStartDate: needsDates ? startDate : undefined,
        rentalEndDate: needsDates ? endDate : undefined,
      })
      useToastStore.getState().showToast(`${label} 요청을 보냈어요`)
      close()
    } catch (submitError) {
      setError(getTradeRequestErrorMessage(submitError))
    }
  }

  return (
    <Modal open={open} onRequestClose={close} labelledBy="product-trade-request-title" showClose={false}>
      <h2 id="product-trade-request-title" className="text-head-03 font-bold text-text-strong">
        {label} 요청 보내기
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">
        <span className="font-bold text-text-strong">{itemTitle}</span>
        <span className="px-1">·</span>
        판매자가 수락하면 거래가 시작돼요
      </p>

      {needsDates && (
        <div className="mt-6 flex gap-3">
          <div className="flex-1">
            <label htmlFor={`${id}-start`} className="text-body-03 font-bold text-text-strong">
              대여 시작일 <span className="text-primary">*</span>
            </label>
            <PixelField invalid={Boolean(error)} className="mt-2">
              <input
                id={`${id}-start`}
                type="date"
                value={startDate}
                min={todayString()}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setError('')
                }}
                style={pixelInputStyle}
                className={`h-12 ${pixelInputClass}`}
              />
            </PixelField>
          </div>
          <div className="flex-1">
            <label htmlFor={`${id}-end`} className="text-body-03 font-bold text-text-strong">
              반납일 <span className="text-primary">*</span>
            </label>
            <PixelField invalid={Boolean(error)} className="mt-2">
              <input
                id={`${id}-end`}
                type="date"
                value={endDate}
                min={startDate || todayString()}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setError('')
                }}
                style={pixelInputStyle}
                className={`h-12 ${pixelInputClass}`}
              />
            </PixelField>
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <label htmlFor={`${id}-message`} className="text-body-03 font-bold text-text-strong">
            남길 말
          </label>
          <span className="text-body-04 text-text-muted">
            {message.length}/{MESSAGE_MAX}
          </span>
        </div>
        <PixelField className="mt-2">
          <textarea
            id={`${id}-message`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={MESSAGE_MAX}
            rows={4}
            placeholder="언제 어디서 만나면 좋을지 적어 주세요."
            style={pixelInputStyle}
            className={`resize-y py-3 ${pixelInputClass}`}
          />
        </PixelField>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-body-04 text-red-600">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={mutation.isPending}
          style={{ clipPath: pixelBox(4) }}
          className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
        >
          {mutation.isPending ? '보내는 중...' : `${label} 요청 보내기`}
        </button>
        <button
          type="button"
          onClick={close}
          style={{ clipPath: pixelBox(4) }}
          className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
        >
          취소
        </button>
      </div>
    </Modal>
  )
}
