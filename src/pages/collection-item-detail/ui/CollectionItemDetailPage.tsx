import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { useCollectionItem } from '../../../entities/collection-item'
import { useMyProfile } from '../../../entities/user'
import { BegRequestModal, TradeRequestModal } from '../../../features/collection-trade'
import type { CollectionTradeType } from '../../../features/collection-trade'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { BackLink } from '../../../shared/ui/back-link'
import { PolaroidPhoto } from '../../../shared/ui/polaroid'
import { Header } from '../../../widgets/header'

// 구걸은 거래 유형이 아니라 별도 API라 타입을 따로 붙여 한 묶음으로 다룬다
type ActionKind = CollectionTradeType | 'BEG'

// 상품 등록의 거래 유형 칩과 같은 문법 — 셋 중 하나를 고르고 아래에서 확정한다
const ACTIONS: { key: ActionKind; label: string }[] = [
  { key: 'RENTAL', label: '대여' },
  { key: 'EXCHANGE', label: '교환' },
  { key: 'BEG', label: '구걸' },
]

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  // 친구가 아니면 남의 도감은 403이다. 무엇을 하면 볼 수 있는지까지 알려준다
  if (status === 403) return '친구끼리만 볼 수 있는 물건이에요. 친구를 맺으면 공개한 물건을 둘러볼 수 있어요.'
  // 비공개이거나 이미 지워진 물건
  if (status === 404) return '볼 수 없는 물건이에요.'
  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  return '물건 정보를 불러오지 못했어요.'
}

// 돌아갈 곳은 들어온 경로에 따라 달라진다 (도감 목록 / 마이페이지 거래 목록)
export function CollectionItemDetailPage() {
  const { collectionItemId: idParam } = useParams()
  const collectionItemId = Number(idParam)
  const isValidId = Number.isInteger(collectionItemId) && collectionItemId > 0

  const detailQuery = useCollectionItem(collectionItemId)
  const detail = detailQuery.data
  const meQuery = useMyProfile()

  // 고른 유형과 모달 열림을 나눠 둔다 — 모달을 닫아도 고른 것은 남아야 다시 보내기 쉽다
  const [action, setAction] = useState<ActionKind | null>(null)
  const [isRequestOpen, setIsRequestOpen] = useState(false)

  const isMine = detail !== undefined && detail.ownerId === meQuery.data?.memberId
  // 이미 거래가 걸린 물건에는 새 요청을 보낼 수 없다. 물건은 그대로 보여주되 고르기만 막는다
  const inTrade = detail?.status === 'IN_PROGRESS'

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 md:px-14 lg:px-24">
        {!isValidId || detailQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img draggable={false} src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(detailQuery.error) : '볼 수 없는 물건이에요.'}
            </p>
            <Link to="/friends" className="mt-4 text-body-04 font-bold text-primary underline">
              친구 목록으로
            </Link>
          </div>
        ) : !detail ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">물건을 불러오는 중이에요...</p>
        ) : (
          <>
            <BackLink
              fallback={{
                to: isMine ? '/item-dex' : `/members/${detail.ownerId}/item-dex`,
                label: isMine ? '내 물건 도감' : `${detail.ownerNickname}님의 물건 도감`,
              }}
            />
            {/* 누구의 도감인지는 제목이 말해주므로 프로필 줄을 따로 두지 않는다 */}
            <h1 className="mt-3 text-head-02 font-bold text-text-strong">
              {isMine ? '내 물건 도감' : `${detail.ownerNickname}의 물건 도감`}
            </h1>

            <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                <PolaroidPhoto imageUrl={detail.imageUrl} />

                {/* 겉 판을 걷어내 흰 카드가 흰 배경에 묻히므로, 정보는 배경 없이 그대로 둔다 */}
                <div className="flex flex-col py-2 md:py-4">
                  <h2 className="text-head-03 font-bold text-text-strong">{detail.title}</h2>
                  <p className="mt-4 whitespace-pre-wrap text-body-03 leading-relaxed text-text-muted">
                    {detail.description || '설명이 없어요'}
                  </p>

                  {/* 내 물건에는 요청을 보낼 수 없어 고르기 자체를 두지 않는다 */}
                  {isMine ? (
                    <p className="mt-8 text-body-04 text-text-muted">내가 등록한 물건이에요.</p>
                  ) : inTrade ? (
                    <p className="mt-8 text-body-04 text-text-muted">지금 거래가 진행 중인 물건이에요.</p>
                  ) : (
                    <div className="mt-8">
                      <p className="text-body-03 font-bold text-text-strong">무엇을 하고 싶나요?</p>

                      {/* 고르지 않은 칩은 픽셀 테두리 2겹으로 윤곽만, 고른 칩만 보라로 채운다 */}
                      <div className="mt-2 flex gap-2" role="group" aria-label="요청 유형">
                        {ACTIONS.map(({ key, label }) => {
                          const active = action === key
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setAction(key)}
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
                                {label}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* 유형별 설명은 모달 부제가 다시 말해주므로 여기서는 두지 않는다 */}
                      <button
                        type="button"
                        disabled={action === null}
                        onClick={() => setIsRequestOpen(true)}
                        style={{ clipPath: pixelBox(4) }}
                        className="mt-6 h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                      >
                        요청 보내기
                      </button>
                    </div>
                  )}
                </div>
            </div>
          </>
        )}
      </div>

      {detail && (
        <>
          <TradeRequestModal
            open={isRequestOpen && (action === 'RENTAL' || action === 'EXCHANGE')}
            collectionItemId={detail.collectionItemId}
            itemTitle={detail.title}
            itemImageUrl={detail.imageUrl}
            tradeType={action === 'EXCHANGE' ? 'EXCHANGE' : 'RENTAL'}
            onClose={() => setIsRequestOpen(false)}
          />
          <BegRequestModal
            open={isRequestOpen && action === 'BEG'}
            collectionItemId={detail.collectionItemId}
            itemTitle={detail.title}
            itemImageUrl={detail.imageUrl}
            onClose={() => setIsRequestOpen(false)}
          />
        </>
      )}
    </div>
  )
}
