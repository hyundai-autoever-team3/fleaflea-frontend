import { useState } from 'react'
import { Link } from 'react-router'

import { useMyCollectionItems } from '../../../entities/collection-item'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import {
  TRADE_TYPE_LABEL,
  getTradeRequestErrorMessage,
  useCreateCollectionTradeRequest,
  type CollectionTradeType,
} from '../api/collection-trade-api'

interface TradeRequestModalProps {
  open: boolean
  collectionItemId: number
  itemTitle: string
  tradeType: CollectionTradeType
  onClose: () => void
}

// 대여·교환 모두 내 도감 물건을 하나 걸어서 보낸다. 그래서 두 경우 모두 같은 고르기 화면을 쓴다
export function TradeRequestModal({ open, collectionItemId, itemTitle, tradeType, onClose }: TradeRequestModalProps) {
  const myItemsQuery = useMyCollectionItems()
  const myItems = myItemsQuery.data ?? []
  const [offerId, setOfferId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const mutation = useCreateCollectionTradeRequest(collectionItemId)

  const label = TRADE_TYPE_LABEL[tradeType]

  function close() {
    setOfferId(null)
    setError('')
    onClose()
  }

  async function handleSubmit() {
    if (offerId === null) return
    setError('')
    try {
      await mutation.mutateAsync({ tradeType, offerCollectionItemId: offerId })
      useToastStore.getState().showToast(`${label} 요청을 보냈어요`)
      close()
    } catch (submitError) {
      setError(getTradeRequestErrorMessage(submitError, tradeType))
    }
  }

  return (
    <Modal open={open} onRequestClose={close} labelledBy="trade-request-title" showClose={false}>
      <h2 id="trade-request-title" className="text-head-03 font-bold text-text-strong">
        {label} 요청 보내기
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">
        <span className="font-bold text-text-strong">{itemTitle}</span>
        <span className="px-1">·</span>
        내 도감에서 걸 물건을 골라 주세요
      </p>

      {myItemsQuery.isPending ? (
        <p className="py-12 text-center text-body-03 text-text-muted">내 도감을 불러오는 중이에요...</p>
      ) : myItemsQuery.isError ? (
        <p className="py-12 text-center text-body-03 text-text-muted">내 도감을 불러오지 못했어요.</p>
      ) : myItems.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <img src={MASCOTS.basket} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
          <p className="mt-3 text-body-03 font-bold text-text-strong">걸 수 있는 물건이 없어요</p>
          <p className="mt-1 text-body-04 text-text-muted">내 도감에 물건을 먼저 등록해 주세요.</p>
          <Link
            to="/item-dex"
            viewTransition
            style={{ clipPath: pixelBox(4) }}
            className="mt-5 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
          >
            내 도감으로 가기
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid max-h-72 grid-cols-3 gap-3 overflow-y-auto">
          {myItems.map((item) => (
            <li key={item.collectionItemId}>
              <button
                type="button"
                onClick={() => setOfferId(item.collectionItemId)}
                aria-pressed={offerId === item.collectionItemId}
                style={{ clipPath: pixelBox(3) }}
                className={
                  offerId === item.collectionItemId
                    ? 'block w-full bg-primary p-[3px] text-left'
                    : 'block w-full bg-primary-subtle p-[3px] text-left transition-colors duration-200 hover:bg-primary-tint'
                }
              >
                <span style={{ clipPath: pixelBox(3) }} className="block bg-bg p-1.5">
                  <span className="flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <img src={MASCOTS.default} alt="" className="h-2/3 object-contain [image-rendering:pixelated]" />
                    )}
                  </span>
                  <span title={item.title} className="mt-1.5 block truncate text-body-04 font-bold text-text-strong">
                    {item.title}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p role="alert" className="mt-4 text-body-04 text-red-600">{error}</p>}

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={offerId === null || mutation.isPending}
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
