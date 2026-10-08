import { BellAlertIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import {
  CollectionSlot,
  EmptySlot,
  useOwnerCollectionItems,
} from '../../../entities/collection-item'
import { useMyFriends } from '../../../entities/friend'
import {
  getSendFriendRequestErrorMessage,
  useSendFriendRequest,
} from '../../../features/friend-manage'
import {
  DAILY_POKE_LIMIT,
  getPokeErrorMessage,
  isPokeLimitExceeded,
  usePokeMember,
} from '../../../features/poke-member'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

// 내 도감과 동일한 슬롯 수를 유지한다.
const SLOTS_PER_PAGE = 12

// 도감 목록 응답에 없는 소유자 닉네임을 이전 화면에서 전달받는다.
interface MemberItemDexState {
  nickname?: string
}

function getListErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  if (status === 403)
    return '친구끼리만 볼 수 있는 도감이에요. 친구를 맺으면 공개한 물건을 둘러볼 수 있어요.'
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

  // 직접 URL로 진입해 전달받은 닉네임이 없으면 친구 목록에서 보완한다.
  const stateNickname = (location.state as MemberItemDexState | null)?.nickname
  const friendsQuery = useMyFriends()
  const friendNickname = friendsQuery.data?.find((friend) => friend.memberId === memberId)?.nickname
  const nickname = stateNickname ?? friendNickname

  const [page, setPage] = useState(0)

  const [pokeError, setPokeError] = useState('')
  // 잔여 횟수 API가 없어 현재 화면의 성공 횟수와 서버의 제한 응답을 함께 사용한다.
  const [pokeCount, setPokeCount] = useState(0)
  const [isPokeLimited, setIsPokeLimited] = useState(false)
  const pokeMutation = usePokeMember()
  const pokeLocked = isPokeLimited || pokeCount >= DAILY_POKE_LIMIT

  function handlePoke() {
    setPokeError('')

    pokeMutation.mutate(memberId, {
      onSuccess: () => {
        setPokeCount((count) => count + 1)
        useToastStore.getState().showToast(nickname ? `${nickname}님을 콕 찔렀어요` : '콕 찔렀어요')
      },
      onError: (error) => {
        if (isPokeLimitExceeded(error)) setIsPokeLimited(true)

        setPokeError(getPokeErrorMessage(error))
      },
    })
  }

  // 친구가 아니어서 볼 수 없는 경우에는 다시 불러와도 결과가 같으므로 친구 요청을 권한다.
  const listStatus = isAxiosError(itemsQuery.error) ? itemsQuery.error.response?.status : undefined

  const friendRequestMutation = useSendFriendRequest()
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [friendRequestError, setFriendRequestError] = useState('')

  function handleFriendRequest() {
    setFriendRequestError('')

    friendRequestMutation.mutate(memberId, {
      onSuccess: () => {
        setFriendRequestSent(true)

        useToastStore.getState().showToast('친구 요청을 보냈어요')
      },
      onError: (error) => setFriendRequestError(getSendFriendRequestErrorMessage(error)),
    })
  }

  const pageCount = Math.max(1, Math.ceil(items.length / SLOTS_PER_PAGE))

  // 공개 물건 수가 줄어 현재 페이지가 사라지면 마지막 페이지로 보정한다.
  if (page > pageCount - 1) setPage(pageCount - 1)

  const pageItems = items.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE)

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 md:px-14 lg:px-24">
        <Link
          to="/friends"
          viewTransition
          className="text-body-04 text-text-muted hover:text-text-strong"
        >
          ← 친구 목록
        </Link>
        <h1 className="mt-3 text-head-02 font-bold text-text-strong">
          {nickname ? `${nickname}님의 물건 도감` : '물건 도감'}
        </h1>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-body-04 text-text-muted">
            공개한 물건만 볼 수 있어요
            {!itemsQuery.isPending && !itemsQuery.isError && ` · ${items.length}개`}
          </p>
          <button
            type="button"
            disabled={pokeMutation.isPending || pokeLocked}
            onClick={handlePoke}
            title={pokeLocked ? `하루에 ${DAILY_POKE_LIMIT}번까지만 찌를 수 있어요` : undefined}
            style={{ clipPath: pixelBox(2) }}
            className="flex h-8 items-center gap-1.5 bg-primary-subtle px-3 text-xs font-bold text-primary transition-colors duration-200 hover:bg-primary-tint disabled:opacity-50 disabled:hover:bg-primary-subtle"
          >
            <BellAlertIcon aria-hidden="true" className="size-3.5" />
            {pokeMutation.isPending
              ? '찌르는 중...'
              : pokeLocked
                ? '오늘은 다 찔렀어요'
                : '콕 찌르기'}
          </button>
        </div>
        {pokeError && <p className="mt-2 text-body-04 text-red-600">{pokeError}</p>}

        {!Number.isInteger(memberId) || memberId <= 0 ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">
            잘못된 주소예요.
          </p>
        ) : itemsQuery.isPending ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">
            도감을 불러오는 중이에요...
          </p>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="h-24 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-4 text-body-03 text-text-muted">
              {getListErrorMessage(itemsQuery.error)}
            </p>
            {listStatus === 403 ? (
              <>
                <button
                  type="button"
                  onClick={handleFriendRequest}
                  disabled={friendRequestMutation.isPending || friendRequestSent}
                  style={{ clipPath: pixelBox() }}
                  className="mt-4 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90 disabled:bg-primary/50"
                >
                  {friendRequestSent
                    ? '친구 요청을 보냈어요'
                    : friendRequestMutation.isPending
                      ? '요청하는 중...'
                      : '친구 요청'}
                </button>

                {friendRequestError && (
                  <p className="mt-2 text-body-04 text-red-600">{friendRequestError}</p>
                )}
              </>
            ) : (
              listStatus !== 401 &&
              listStatus !== 404 && (
                <button
                  type="button"
                  onClick={() => void itemsQuery.refetch()}
                  style={{ clipPath: pixelBox() }}
                  className="mt-4 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
                >
                  다시 시도
                </button>
              )
            )}
          </div>
        ) : (
          <div className="relative mt-8">
            <div
              style={{ clipPath: pixelBox(6) }}
              className="bg-primary-tint p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]"
            >
              <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-3 md:p-4">
                <ul className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-4">
                  {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => {
                    const item = pageItems[index]

                    return (
                      <li key={item?.collectionItemId ?? `empty-${page}-${index}`}>
                        {item ? (
                          <CollectionSlot
                            item={item}
                            onClick={() =>
                              void navigate(`/collection-items/${item.collectionItemId}`, {
                                viewTransition: true,
                              })
                            }
                          />
                        ) : (
                          // 다른 회원의 도감에서는 빈 슬롯으로 물건을 등록할 수 없다.
                          <EmptySlot />
                        )}
                      </li>
                    )
                  })}
                </ul>

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
                <img
                  draggable={false}
                  src={MASCOTS.basket}
                  alt=""
                  className="h-20 object-contain [image-rendering:pixelated]"
                />
                <p className="mt-3 text-body-03 font-bold text-text-strong">
                  아직 공개한 물건이 없어요
                </p>
                <p className="mt-1 text-body-04 text-text-muted">물건을 공개하면 여기에 보여요.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
