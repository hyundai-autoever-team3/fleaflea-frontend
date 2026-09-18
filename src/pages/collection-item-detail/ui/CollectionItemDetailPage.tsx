import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { useCollectionItem } from '../../../entities/collection-item'
import { useMyFriends } from '../../../entities/friend'
import { useMyProfile } from '../../../entities/user'
import { BegRequestModal, TradeRequestModal } from '../../../features/collection-trade'
import type { CollectionTradeType } from '../../../features/collection-trade'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Header } from '../../../widgets/header'

// 한 번에 하나만 열리므로 어떤 요청 화면인지만 들고 있으면 된다
type RequestKind = CollectionTradeType | 'BEG' | null

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  // 비공개이거나 삭제된 물건에 직접 들어온 경우를 같은 문구로 덮는다
  if (status === 403 || status === 404) return '볼 수 없는 물건이에요.'
  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  return '물건 정보를 불러오지 못했어요.'
}

export function CollectionItemDetailPage() {
  const { collectionItemId: idParam } = useParams()
  const collectionItemId = Number(idParam)
  const isValidId = Number.isInteger(collectionItemId) && collectionItemId > 0

  const detailQuery = useCollectionItem(collectionItemId)
  const detail = detailQuery.data
  const meQuery = useMyProfile()
  const friendsQuery = useMyFriends()

  const [request, setRequest] = useState<RequestKind>(null)

  const isMine = detail !== undefined && detail.ownerId === meQuery.data?.memberId
  const isFriend = friendsQuery.data?.some((friend) => friend.memberId === detail?.ownerId) ?? false

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 lg:px-8">
        {!isValidId || detailQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(detailQuery.error) : '볼 수 없는 물건이에요.'}
            </p>
            <Link to="/friends" className="mt-4 text-body-04 font-bold text-primary underline">
              친구 목록으로
            </Link>
          </div>
        ) : !detail ? (
          <p className="py-24 text-center text-body-03 text-text-muted">물건을 불러오는 중이에요...</p>
        ) : (
          <>
            <Link
              to={isMine ? '/item-dex' : `/members/${detail.ownerId}/item-dex`}
              viewTransition
              className="text-body-04 text-text-muted hover:text-text-strong"
            >
              ← {isMine ? '내 물건 도감' : `${detail.ownerNickname}님의 물건 도감`}
            </Link>
            <h1 className="mt-3 text-head-02 font-bold text-text-strong">
              {isMine ? '내 물건 도감' : `${detail.ownerNickname}의 물건 도감`}
            </h1>
            <p className="mt-1 text-body-04 text-text-muted">
              {isMine ? '내가 공개한 물건이에요.' : `${detail.ownerNickname}가 공개한 물건을 구경해요.`}
            </p>

            {/* 소유자 — 목업의 프로필 줄 */}
            <div className="mt-6 flex items-center gap-3">
              <img
                src={MASCOTS.default}
                alt=""
                style={{ clipPath: pixelBox(3) }}
                className="size-14 bg-primary-subtle object-cover [image-rendering:pixelated]"
              />
              <div className="min-w-0">
                <p className="truncate text-body-02 font-bold text-text-strong">{detail.ownerNickname}</p>
                {!isMine && isFriend && (
                  <span
                    style={{ clipPath: pixelBox(2) }}
                    className="mt-1 inline-block bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary"
                  >
                    친구
                  </span>
                )}
              </div>
            </div>

            {/* 상품 상세와 같은 구성 — 그라데이션 판 위에 사진 칸과 정보 칸 */}
            <div style={{ clipPath: pixelBox(6) }} className="mt-6 bg-[image:var(--gradient-dreamy)] p-3 md:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,480px)_minmax(0,1fr)] md:gap-4">
                <div style={{ clipPath: pixelBox(4) }} className="bg-primary-subtle p-2">
                  <div
                    style={{ clipPath: pixelBox(4) }}
                    className="flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
                  >
                    {detail.imageUrl ? (
                      <img src={detail.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <img src={MASCOTS.default} alt="" className="h-28 object-contain [image-rendering:pixelated]" />
                    )}
                  </div>
                </div>

                <div style={{ clipPath: pixelBox(4) }} className="flex flex-col bg-bg p-6 md:p-8">
                  <h2 className="text-head-03 font-bold text-text-strong">{detail.title}</h2>
                  <p className="mt-4 whitespace-pre-wrap text-body-03 leading-relaxed text-text-muted">
                    {detail.description || '설명이 없어요'}
                  </p>

                  {/* 내 물건에는 요청을 보낼 수 없어 버튼을 두지 않는다 */}
                  {isMine ? (
                    <p className="mt-8 text-body-04 text-text-muted">내가 등록한 물건이에요.</p>
                  ) : (
                    <div className="mt-8 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setRequest('RENTAL')}
                        style={{ clipPath: pixelBox(4) }}
                        className="h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                      >
                        대여하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequest('EXCHANGE')}
                        style={{ clipPath: pixelBox(4) }}
                        className="h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                      >
                        교환하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequest('BEG')}
                        style={{ clipPath: pixelBox(4) }}
                        className="h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                      >
                        구걸하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isMine && (
              <div
                style={{ clipPath: pixelBox(6) }}
                className="mt-4 flex items-start gap-3 bg-primary-subtle px-5 py-4"
              >
                <img src={MASCOTS.wink} alt="" className="h-10 shrink-0 object-contain [image-rendering:pixelated]" />
                <div>
                  <p className="text-body-03 font-bold text-text-strong">소장품에 마음을 전해요</p>
                  <p className="mt-1 text-body-04 text-text-muted">
                    구걸하기는 이 물건이 갖고 싶다는 의사 표시예요. 대여·교환은 내 도감 물건을 하나 걸어서 요청해요.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {detail && (
        <>
          <TradeRequestModal
            open={request === 'RENTAL' || request === 'EXCHANGE'}
            collectionItemId={detail.collectionItemId}
            itemTitle={detail.title}
            tradeType={request === 'EXCHANGE' ? 'EXCHANGE' : 'RENTAL'}
            onClose={() => setRequest(null)}
          />
          <BegRequestModal
            open={request === 'BEG'}
            collectionItemId={detail.collectionItemId}
            itemTitle={detail.title}
            onClose={() => setRequest(null)}
          />
        </>
      )}
    </div>
  )
}
