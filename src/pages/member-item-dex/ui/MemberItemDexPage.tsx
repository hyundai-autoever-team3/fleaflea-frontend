import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { CollectionSlot, EmptySlot, useOwnerCollectionItems } from '../../../entities/collection-item'
import { useMyFriends } from '../../../entities/friend'
import { getPokeErrorMessage, usePokeMember } from '../../../features/poke-member'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { useToastStore } from '../../../shared/ui/toast'
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
  const navigate = useNavigate()

  const itemsQuery = useOwnerCollectionItems(memberId)
  const items = itemsQuery.data ?? []

  // 이름은 들어온 화면이 넘겨준 값을 먼저 쓰고, 없으면 내 친구 목록에서 찾는다.
  // 주소만 붙여넣고 들어와도 이름이 비어 보이지 않게 하기 위함
  const stateNickname = (location.state as MemberItemDexState | null)?.nickname
  const friendsQuery = useMyFriends()
  const friendNickname = friendsQuery.data?.find((friend) => friend.memberId === memberId)?.nickname
  const nickname = stateNickname ?? friendNickname

  const [page, setPage] = useState(0)
  // 남의 도감을 구경하다 말을 걸고 싶어지는 자리라 여기에 둔다.
  // 알림 하나를 보내고 끝나므로 다시 받을 목록도, 옮길 화면도 없다
  const [pokeError, setPokeError] = useState('')
  const pokeMutation = usePokeMember()

  function handlePoke() {
    setPokeError('')
    pokeMutation.mutate(memberId, {
      onSuccess: () => useToastStore.getState().showToast(nickname ? `${nickname}님을 콕 찔렀어요` : '콕 찔렀어요'),
      onError: (error) => setPokeError(getPokeErrorMessage(error)),
    })
  }

  const pageCount = Math.max(1, Math.ceil(items.length / SLOTS_PER_PAGE))
  if (page > pageCount - 1) setPage(pageCount - 1)
  const pageItems = items.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE)

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 md:px-14 lg:px-24">
        {/* 상품 수정 화면과 같은 위치·모양의 뒤로가기 */}
        <Link to="/friends" viewTransition className="text-body-04 text-text-muted hover:text-text-strong">
          ← 친구 목록
        </Link>
        <h1 className="mt-3 text-head-02 font-bold text-text-strong">
          {/* 닉네임은 20자까지 올 수 있어 줄바꿈되게 두고, 모를 때는 사람 이름 없이 제목만 */}
          {nickname ? `${nickname}님의 물건 도감` : '물건 도감'}
        </h1>
        {/* 서버가 공개 물건만 내려주므로, 비어 보이는 이유를 미리 알려둔다 */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-body-04 text-text-muted">
            공개한 물건만 볼 수 있어요
            {!itemsQuery.isPending && !itemsQuery.isError && ` · ${items.length}개`}
          </p>
          <button
            type="button"
            disabled={pokeMutation.isPending}
            onClick={handlePoke}
            style={{ clipPath: pixelBox(2) }}
            className="flex h-8 items-center gap-1.5 bg-status-nudge-subtle px-3 text-xs font-bold text-status-nudge transition-colors duration-200 hover:brightness-95 disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-sm leading-none">👉</span>
            {pokeMutation.isPending ? '찌르는 중...' : '콕 찌르기'}
          </button>
        </div>
        {pokeError && <p className="mt-2 text-body-04 text-red-600">{pokeError}</p>}

        {!Number.isInteger(memberId) || memberId <= 0 ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">잘못된 주소예요.</p>
        ) : itemsQuery.isPending ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">도감을 불러오는 중이에요...</p>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
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
                          // 칸을 누르면 물건 상세로 — 거래·구걸 요청은 거기서 보낸다
                          <CollectionSlot
                            item={item}
                            onClick={() =>
                              void navigate(`/collection-items/${item.collectionItemId}`, { viewTransition: true })
                            }
                          />
                        ) : (
                          // 남의 도감이라 빈 칸은 누를 수 없음 — 판 모양만 유지
                          <EmptySlot />
                        )}
                      </li>
                    )
                  })}
                </ul>

                {/* 내 도감과 같은 자리·같은 모양의 페이지 번호 */}
                {pageCount > 1 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t border-primary-subtle pt-3">
                    {Array.from({ length: pageCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPage(index)}
                        aria-label={`${index + 1}페이지`}
                        aria-current={page === index ? 'page' : undefined}
                        style={{ clipPath: pixelBox(2) }}
                        className={
                          page === index
                            ? 'size-8 bg-primary text-body-04 font-bold text-white'
                            : 'size-8 bg-primary-subtle text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong'
                        }
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
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
      </div>
    </div>
  )
}
