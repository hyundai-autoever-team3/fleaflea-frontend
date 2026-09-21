import { useState } from 'react'
import { Link } from 'react-router'

import { useMyCollectionItems } from '../../../entities/collection-item'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { Modal } from '../../../shared/ui/modal'
import { Photo } from '../../../shared/ui/photo'
import { useToastStore } from '../../../shared/ui/toast'
import {
  TRADE_TYPE_LABEL,
  getTradeRequestErrorMessage,
  useCreateCollectionTradeRequest,
  type CollectionTradePayload,
  type CollectionTradeType,
} from '../api/collection-trade-api'
import { MascotTip } from './MascotTip'
import { PreviewSlot } from './PreviewSlot'

// 모달이 길어지지 않도록 접힌 상태에서 보여줄 칸 수
const VISIBLE_COUNT = 4

interface TradeRequestModalProps {
  open: boolean
  collectionItemId: number
  itemTitle: string
  itemImageUrl?: string | null
  tradeType: CollectionTradeType
  onClose: () => void
}

// 교환은 내 물건 하나를 걸어 맞바꾸고, 대여는 상대 물건을 빌리기만 한다.
// 그래서 대여에는 고르기 화면이 없고 보낼 때도 offerCollectionItemId를 넣지 않는다
export function TradeRequestModal({
  open,
  collectionItemId,
  itemTitle,
  itemImageUrl,
  tradeType,
  onClose,
}: TradeRequestModalProps) {
  const isExchange = tradeType === 'EXCHANGE'
  const myItemsQuery = useMyCollectionItems()
  const myItems = myItemsQuery.data ?? []
  const [offerId, setOfferId] = useState<number | null>(null)
  // 모달에서는 네 칸만 보여주고, 나머지는 전체 보기로 펼친다
  const [showAll, setShowAll] = useState(false)
  const [error, setError] = useState('')
  const mutation = useCreateCollectionTradeRequest(collectionItemId)

  const label = TRADE_TYPE_LABEL[tradeType]
  const offered = myItems.find((item) => item.collectionItemId === offerId)
  const visibleItems = showAll ? myItems : myItems.slice(0, VISIBLE_COUNT)
  // 비공개 물건은 거래 대상이 될 수 없다. 목록에서 빼면 "내 물건이 왜 없지" 하게 되므로
  // 보여주되 고를 수 없게 하고, 개수도 고를 수 있는 것만 센다
  const tradableCount = myItems.filter((item) => item.isPublic).length
  // 고른 뒤 목록이 갱신돼 그 물건이 사라지거나 비공개로 바뀌었을 수 있어 공개 여부까지 본다
  const needsPick = isExchange && (offered === undefined || !offered.isPublic)

  function close() {
    setOfferId(null)
    setError('')
    onClose()
  }

  async function handleSubmit() {
    if (needsPick) return
    setError('')
    // 대여는 거는 물건이 없어 tradeType만 보낸다
    const payload: CollectionTradePayload =
      isExchange && offerId !== null ? { tradeType, offerCollectionItemId: offerId } : { tradeType }
    try {
      await mutation.mutateAsync(payload)
      useToastStore.getState().showToast(`${label} 요청을 보냈어요`)
      close()
    } catch (submitError) {
      setError(getTradeRequestErrorMessage(submitError, tradeType))
    }
  }

  return (
    <Modal
      open={open}
      onRequestClose={close}
      labelledBy="trade-request-title"
      size={isExchange ? 'md' : 'compact'}
      showClose={false}
    >
      <h2 id="trade-request-title" className="text-xl font-bold text-text-strong">
        {label} 요청 보내기
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">
        {isExchange ? '내 물건 하나와 맞바꿔요' : '이 물건을 빌려요'}
      </p>

      {isExchange ? (
        /* 교환판 — 무엇과 무엇이 오가는지 */
        <div style={{ clipPath: pixelBox(4) }} className="mt-4 bg-primary-subtle p-3">
          <div className="mx-auto flex max-w-[360px] items-center gap-3">
            <PreviewSlot label="내 물건" title={offered?.title} imageUrl={offered?.imageUrl} />
            <div className="flex shrink-0 flex-col gap-1 pt-4 text-primary">
              <Sprite rows={GLYPHS.arrowRight} className="w-6" />
              <Sprite rows={GLYPHS.arrowLeft} className="w-6" />
            </div>
            <PreviewSlot label="상대 물건" title={itemTitle} imageUrl={itemImageUrl} />
          </div>
          <MascotTip mascot={MASCOTS.wink} className="mt-3">
            서로 수락하면 물건을 맞바꿔요. 주고받는 방법은 수락한 뒤에 정해요.
          </MascotTip>
        </div>
      ) : (
        /* 대여 — 교환판과 같은 판·같은 칸 문법을 쓰되, 내 물건을 걸지 않으므로 상대 물건 한 칸만 둔다 */
        <div style={{ clipPath: pixelBox(4) }} className="mt-4 bg-primary-subtle p-3">
          <div className="mx-auto w-[min(180px,60%)]">
            <PreviewSlot label="빌릴 물건" title={itemTitle} imageUrl={itemImageUrl} />
          </div>
          <MascotTip mascot={MASCOTS.wink} className="mt-3">
            주인이 수락하면 빌릴 수 있어요. 기간과 주고받는 방법은 수락한 뒤에 서로 정해요.
          </MascotTip>
        </div>
      )}

      {/* 고르기는 교환에만 있다 */}
      {isExchange &&
        (myItemsQuery.isPending ? (
          <p className="py-12 text-center text-body-03 text-text-muted">내 도감을 불러오는 중이에요...</p>
        ) : myItemsQuery.isError ? (
          <p className="py-12 text-center text-body-03 text-text-muted">내 도감을 불러오지 못했어요.</p>
        ) : tradableCount === 0 ? (
          // 물건이 아예 없는 것과 전부 비공개인 것은 다음에 할 일이 달라 문구를 가른다
          <div className="flex flex-col items-center py-10 text-center">
            <img src={MASCOTS.basket} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
            <p className="mt-3 text-body-03 font-bold text-text-strong">
              {myItems.length === 0 ? '바꿀 물건이 없어요' : '바꿀 수 있는 물건이 없어요'}
            </p>
            <p className="mt-1 text-body-04 text-text-muted">
              {myItems.length === 0
                ? '내 도감에 물건을 먼저 등록해 주세요.'
                : '비공개 물건은 교환할 수 없어요. 도감에서 공개로 바꿔 주세요.'}
            </p>
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
          <>
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <p className="text-body-03 font-bold text-text-strong">
                내 도감에서 고르기 <span className="text-primary">{tradableCount}</span>
              </p>
              {myItems.length > VISIBLE_COUNT && (
                <button
                  type="button"
                  onClick={() => setShowAll((current) => !current)}
                  className="shrink-0 text-body-04 font-bold text-primary underline transition-colors duration-200 hover:text-primary/80"
                >
                  {showAll ? '접기' : '전체 보기'}
                </button>
              )}
            </div>
            {/* 접힌 상태는 네 칸 한 줄, 전체 보기는 같은 칸 크기로 아래로 쌓고 스크롤 */}
            <ul className={showAll ? 'mt-2 grid max-h-64 grid-cols-4 gap-2 overflow-y-auto' : 'mt-2 grid grid-cols-4 gap-2'}>
              {visibleItems.map((item) => {
                const selected = offerId === item.collectionItemId
                return (
                  <li key={item.collectionItemId}>
                    <button
                      type="button"
                      disabled={!item.isPublic}
                      onClick={() => setOfferId(item.collectionItemId)}
                      aria-pressed={selected}
                      title={item.isPublic ? item.title : `${item.title} — 비공개라 교환할 수 없어요`}
                      aria-label={item.isPublic ? item.title : `${item.title}, 비공개라 고를 수 없음`}
                      style={{ clipPath: pixelBox(3) }}
                      className={
                        selected
                          ? 'block w-full bg-primary p-[2px]'
                          : 'block w-full bg-transparent p-[2px] transition-colors duration-200 hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent'
                      }
                    >
                      <span
                        style={{ clipPath: pixelBox(3) }}
                        className="relative flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
                      >
                        <Photo
                          src={item.imageUrl}
                          fallback={MASCOTS.default}
                          className="size-full object-cover"
                          fallbackClassName="h-2/3"
                        />
                        {selected && (
                          <span
                            style={{ clipPath: pixelBox(2) }}
                            className="absolute right-1 top-1 grid size-5 place-items-center bg-primary text-white"
                          >
                            <Sprite rows={GLYPHS.check} className="w-2.5" />
                          </span>
                        )}
                        {/* 왜 고를 수 없는지 칸 위에서 바로 보이게 */}
                        {!item.isPublic && (
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-xs font-bold text-white">
                            비공개
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ))}

      {error && (
        <p role="alert" className="mt-4 text-body-04 text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={needsPick || mutation.isPending}
          style={{ clipPath: pixelBox(4) }}
          className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
        >
          {mutation.isPending ? '보내는 중...' : needsPick ? '바꿀 물건을 골라 주세요' : `${label} 요청 보내기`}
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
