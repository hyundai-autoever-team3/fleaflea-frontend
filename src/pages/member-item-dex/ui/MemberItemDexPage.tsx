import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { CollectionSlot, EmptySlot, useCollectionItem, useOwnerCollectionItems } from '../../../entities/collection-item'
import { useMyFriends } from '../../../entities/friend'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { Header } from '../../../widgets/header'

// 내 도감과 같은 판을 쓰므로 한 페이지에 보이는 칸 수도 맞춘다
const SLOTS_PER_PAGE = 12

// 목록 응답에는 소유자 정보가 없어, 들어올 때 닉네임을 함께 넘겨받는다
interface MemberItemDexState {
  nickname?: string
}

function getListErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  if (status === 403) return '이 사람의 도감은 볼 수 없어요.'
  if (status === 404) return '회원을 찾을 수 없어요.'
  return '도감을 불러오지 못했어요.'
}

export function MemberItemDexPage() {
  const { memberId: memberIdParam } = useParams()
  const memberId = Number(memberIdParam)
  const location = useLocation()

  const itemsQuery = useOwnerCollectionItems(memberId)
  const items = itemsQuery.data ?? []

  // 이름은 세 곳에서 순서대로 찾는다: 들어온 화면이 넘겨준 값 → 내 친구 목록 → 열어본 물건의 소유자.
  // 주소만 붙여넣고 들어와도 이름이 비어 보이지 않게 하기 위함
  const stateNickname = (location.state as MemberItemDexState | null)?.nickname
  const friendsQuery = useMyFriends()
  const friendNickname = friendsQuery.data?.find((friend) => friend.memberId === memberId)?.nickname

  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / SLOTS_PER_PAGE))
  if (page > pageCount - 1) setPage(pageCount - 1)
  const pageItems = items.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const detailQuery = useCollectionItem(selectedId ?? 0)
  const detail = detailQuery.data

  const nickname = stateNickname ?? friendNickname ?? detail?.ownerNickname

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <h1 className="text-head-02 font-bold text-text-strong">
          {/* 닉네임은 20자까지 올 수 있어 줄바꿈되게 두고, 모를 때는 사람 이름 없이 제목만 */}
          {nickname ? `${nickname}님의 물건 도감` : '물건 도감'}
        </h1>
        {/* 서버가 공개 물건만 내려주므로, 비어 보이는 이유를 미리 알려둔다 */}
        <p className="mt-1 text-body-04 text-text-muted">
          공개한 물건만 볼 수 있어요
          {!itemsQuery.isPending && !itemsQuery.isError && ` · ${items.length}개`}
        </p>

        {!Number.isInteger(memberId) || memberId <= 0 ? (
          <p className="py-24 text-center text-body-03 text-text-muted">잘못된 주소예요.</p>
        ) : itemsQuery.isPending ? (
          <p className="py-24 text-center text-body-03 text-text-muted">도감을 불러오는 중이에요...</p>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">{getListErrorMessage(itemsQuery.error)}</p>
            <button
              type="button"
              onClick={() => void itemsQuery.refetch()}
              style={{ clipPath: pixelBox() }}
              className="mt-4 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="relative mt-8">
            <div style={{ clipPath: pixelBox(6) }} className="bg-primary-tint p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
              <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-3 md:p-4">
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => {
                    const item = pageItems[index]
                    return (
                      <li key={item?.collectionItemId ?? `empty-${page}-${index}`}>
                        {item ? (
                          <CollectionSlot item={item} onClick={() => setSelectedId(item.collectionItemId)} />
                        ) : (
                          // 남의 도감이라 빈 칸은 누를 수 없음 — 판 모양만 유지
                          <EmptySlot />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>

            {items.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <img src={MASCOTS.basket} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                <p className="mt-3 text-body-03 font-bold text-text-strong">아직 공개한 물건이 없어요</p>
                <p className="mt-1 text-body-04 text-text-muted">물건을 공개하면 여기에 보여요.</p>
              </div>
            )}
          </div>
        )}

        {!itemsQuery.isPending && !itemsQuery.isError && pageCount > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0}
              style={{ clipPath: pixelBox(2) }}
              className="flex h-9 items-center bg-primary-subtle px-4 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-body-04 font-bold text-text-muted">
              {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              disabled={page === pageCount - 1}
              style={{ clipPath: pixelBox(2) }}
              className="flex h-9 items-center bg-primary-subtle px-4 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}

        <Link
          to="/friends"
          className="mt-8 inline-block text-body-04 font-bold text-text-muted underline transition-colors duration-200 hover:text-text-strong"
        >
          친구 목록으로
        </Link>
      </div>

      {/* 상세 — 남의 물건이라 보기만 가능 */}
      <Modal
        open={selectedId !== null}
        onRequestClose={() => setSelectedId(null)}
        labelledBy="member-collection-detail-title"
        size="sm"
        showClose={false}
      >
        {detailQuery.isPending ? (
          <p className="py-10 text-center text-body-03 text-text-muted">불러오는 중이에요...</p>
        ) : detailQuery.isError || !detail ? (
          <div className="py-10 text-center">
            <img src={MASCOTS.surprised} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">물건 정보를 불러오지 못했어요.</p>
          </div>
        ) : (
          <div className="py-2">
            <div
              style={{ clipPath: pixelBox(4) }}
              className="flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
            >
              {detail.imageUrl ? (
                <img src={detail.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <img src={MASCOTS.default} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
              )}
            </div>

            <span
              style={{ clipPath: pixelBox(2) }}
              className="mt-4 inline-block bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary"
            >
              {detail.ownerNickname}님의 물건
            </span>
            <h2 id="member-collection-detail-title" className="mt-2 text-body-02 font-bold text-text-strong">
              {detail.title}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted">
              {detail.description || '설명이 없어요'}
            </p>

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              style={{ clipPath: pixelBox(4) }}
              className="mt-8 w-full bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
            >
              닫기
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
