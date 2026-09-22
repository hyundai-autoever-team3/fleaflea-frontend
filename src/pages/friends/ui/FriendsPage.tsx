import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import {
  getMemberSearchErrorMessage,
  useFriendRequests,
  useMemberSearch,
  useMyFriends,
} from '../../../entities/friend'
import type { Friendship, RelationshipStatus } from '../../../entities/friend'
import {
  FRIEND_REQUEST_ACTION_LABEL,
  getDeleteFriendshipErrorMessage,
  getFriendRequestActionErrorMessage,
  getSendFriendRequestErrorMessage,
  useDeleteFriendship,
  useRespondToFriendRequest,
  useSendFriendRequest,
  type FriendRequestAction,
} from '../../../features/friend-manage'
import { useMyProfile } from '../../../entities/user'
import { MASCOTS } from '../../../shared/config/mascots'
import { Avatar } from '../../../shared/ui/avatar'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

const ACTION_BUTTON = 'flex h-9 items-center px-3 text-xs font-bold transition-colors duration-200'

// 검색 결과에서 관계 상태를 한 줄로 알려줌. NONE은 아직 아무 관계가 없어 표시하지 않음
const SEARCH_CAPTION: Record<RelationshipStatus, string> = {
  SELF: '나예요',
  NONE: '',
  REQUESTED: '요청을 보냈어요',
  REQUEST_RECEIVED: '나에게 친구 요청을 보냈어요',
  FRIEND: '이미 친구예요',
}

// 한 줄 = 아바타 + 닉네임(+ 보조 문구) + 오른쪽 동작 버튼들
function FriendRow({
  friend,
  caption,
  children,
}: {
  // 검색 결과에는 friendshipId가 없어서, 줄을 그리는 데 실제로 쓰는 값만 요구함
  friend: Pick<Friendship, 'nickname' | 'profileImageUrl'>
  caption?: string
  children: ReactNode
}) {
  return (
    <li style={{ clipPath: pixelBox(4) }} className="bg-primary-tint p-[2px]">
      <div style={{ clipPath: pixelBox(4) }} className="flex items-center gap-3 bg-bg px-4 py-3">
        <Avatar profileImageUrl={friend.profileImageUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-03 font-bold text-text-strong">{friend.nickname}</p>
          {caption && <p className="mt-0.5 text-body-04 text-text-muted">{caption}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">{children}</div>
      </div>
    </li>
  )
}

function SectionTitle({ label, count }: { label: string; count?: number }) {
  return (
    <h2 className="text-head-03 font-bold text-text-strong">
      {label}
      {count !== undefined && <span className="ml-1 text-primary">{count}</span>}
    </h2>
  )
}

export function FriendsPage() {
  const meQuery = useMyProfile()
  const friendsQuery = useMyFriends()
  const receivedQuery = useFriendRequests('RECEIVED')
  const sentQuery = useFriendRequests('SENT')

  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Friendship | null>(null)

  // 서버에 물어보는 검색이라 입력할 때마다 보내지 않고, 제출한 말만 조회 (한글 조합 문제도 함께 피함)
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const searchQuery = useMemberSearch(submittedKeyword)

  const friends = friendsQuery.data ?? []
  const received = receivedQuery.data ?? []
  const sent = sentQuery.data ?? []

  // 검색 API에는 관계·프로필이 없으므로 이미 조회한 친구/요청 목록과 대조.
  // 목록 조회가 실패하거나 진행 중이면 관계를 NONE으로 단정하지 않음.
  const hasRelationshipError = friendsQuery.isError || receivedQuery.isError || sentQuery.isError
  const relationshipsReady = friendsQuery.isSuccess && receivedQuery.isSuccess && sentQuery.isSuccess
  const searchResults = (searchQuery.data ?? []).map((person) => {
    const friend = friends.find((entry) => entry.memberId === person.memberId)
    const receivedRequest = received.find((entry) => entry.memberId === person.memberId)
    const sentRequest = sent.find((entry) => entry.memberId === person.memberId)
    // 내 닉네임으로 검색하면 나도 결과에 나온다. 나에게는 요청을 보낼 수 없어(400) 먼저 가른다
    const relationshipStatus: RelationshipStatus | null = person.memberId === meQuery.data?.memberId ? 'SELF'
      : !relationshipsReady ? null
      : friend ? 'FRIEND'
      : receivedRequest ? 'REQUEST_RECEIVED'
      : sentRequest ? 'REQUESTED'
      : 'NONE'
    return {
      ...person,
      profileImageUrl: (friend ?? receivedRequest ?? sentRequest)?.profileImageUrl ?? null,
      relationshipStatus,
    }
  })

  // 목록 새로고침은 각 mutation 안에서 한다. 여기서는 어느 줄이 처리 중인지와
  // 실패 문구만 다루면 된다
  const sendRequestMutation = useSendFriendRequest()
  const respondMutation = useRespondToFriendRequest()
  const deleteFriendshipMutation = useDeleteFriendship()

  const pendingId = sendRequestMutation.isPending ? sendRequestMutation.variables
    : respondMutation.isPending ? respondMutation.variables.memberId
    : deleteFriendshipMutation.isPending ? deleteTarget?.memberId ?? null
    : null

  // 수락·거절·취소는 처리 흐름이 같아 한 곳에서 실행하고, 문구만 동작에 맞춰 바꿈
  function runRequestAction(memberId: number, action: FriendRequestAction, successMessage: string) {
    setError('')
    respondMutation.mutate({ action, memberId }, {
      onSuccess: () => useToastStore.getState().showToast(successMessage),
      onError: (actionError) => setError(
        getFriendRequestActionErrorMessage(actionError, FRIEND_REQUEST_ACTION_LABEL[action]),
      ),
    })
  }

  function handleSendRequest(memberId: number) {
    setError('')
    sendRequestMutation.mutate(memberId, {
      onSuccess: () => useToastStore.getState().showToast('친구 요청을 보냈어요'),
      onError: (sendError) => setError(getSendFriendRequestErrorMessage(sendError)),
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    setError('')
    deleteFriendshipMutation.mutate(deleteTarget.friendshipId, {
      onSuccess: () => {
        useToastStore.getState().showToast('친구를 삭제했어요')
        setDeleteTarget(null)
      },
      onError: (deleteError) => setError(getDeleteFriendshipErrorMessage(deleteError)),
    })
  }

  const isLoading = friendsQuery.isPending || receivedQuery.isPending || sentQuery.isPending

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        <h1 className="text-head-02 font-bold text-text-strong">친구</h1>

        {/* 안내 — 처음 들어온 사람이 바로 보도록 제목 바로 아래에 */}
        <div
          style={{ clipPath: pixelBox(6) }}
          className="mt-4 flex items-start gap-3 bg-primary-subtle px-5 py-4"
        >
          <img src={MASCOTS.wink} alt="" className="h-10 shrink-0 object-contain [image-rendering:pixelated]" />
          <div>
            <p className="text-body-03 font-bold text-text-strong">친구가 되는 방법!</p>
            <p className="mt-1 text-body-04 text-text-muted">
              마켓 참여자 목록에서 친구 요청을 보내면 상대에게 알림이 가요. 상대가 수락하면 친구가 돼요.
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-body-04 text-red-600">{error}</p>}

        {isLoading ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">친구 목록을 불러오는 중이에요...</p>
        ) : (
          <>
            {/* 받은 요청 — 있을 때만 */}
            {received.length > 0 && (
              <section className="mt-8">
                <SectionTitle label="받은 친구 요청" count={received.length} />
                <ul className="mt-4 flex flex-col gap-3">
                  {received.map((friend) => (
                    <FriendRow key={friend.memberId} friend={friend} caption="나에게 친구 요청을 보냈어요">
                      <button
                        type="button"
                        disabled={pendingId === friend.memberId}
                        onClick={() =>
                          runRequestAction(friend.memberId, 'accept', '친구가 됐어요!')
                        }
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50`}
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === friend.memberId}
                        onClick={() =>
                          runRequestAction(friend.memberId, 'reject', '요청을 거절했어요')
                        }
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary-subtle text-text-muted hover:bg-red-100 hover:text-red-600`}
                      >
                        거절
                      </button>
                    </FriendRow>
                  ))}
                </ul>
              </section>
            )}

            {/* 보낸 요청 — 있을 때만 */}
            {sent.length > 0 && (
              <section className="mt-10">
                <SectionTitle label="보낸 친구 요청" count={sent.length} />
                <ul className="mt-4 flex flex-col gap-3">
                  {sent.map((friend) => (
                    <FriendRow key={friend.memberId} friend={friend} caption="수락을 기다리는 중이에요">
                      <button
                        type="button"
                        disabled={pendingId === friend.memberId}
                        onClick={() =>
                          runRequestAction(friend.memberId, 'cancel', '요청을 취소했어요')
                        }
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong`}
                      >
                        요청 취소
                      </button>
                    </FriendRow>
                  ))}
                </ul>
              </section>
            )}

            {/* 내 친구 */}
            <section className="mt-10">
              <SectionTitle label="내 친구" count={friends.length} />

              {/* 닉네임 검색 — 마켓 검색창과 같은 모양. 다만 서버 조회라 글자마다 보내지 않고 버튼으로 제출.
                  백엔드 API가 아직 없어 404가 오면 "준비 중" 안내가 뜸 */}
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmittedKeyword(keyword.trim())
                }}
                className="mt-4 w-full max-w-md"
              >
                <label className="flex items-center gap-2 rounded-full bg-primary-subtle px-5 py-3 focus-within:ring-2 focus-within:ring-primary-tint">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 shrink-0 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="닉네임으로 친구 찾기"
                    aria-label="닉네임으로 친구 찾기"
                    className="w-full bg-transparent text-body-03 text-text-strong outline-none placeholder:text-text-muted/50"
                  />
                </label>
              </form>

              {submittedKeyword && (
                <div className="mt-4">
                  {searchQuery.isPending ? (
                    <p className="text-body-04 text-text-muted">찾는 중이에요...</p>
                  ) : searchQuery.isError ? (
                    <p className="text-body-04 text-text-muted">{getMemberSearchErrorMessage(searchQuery.error)}</p>
                  ) : searchQuery.data.length === 0 ? (
                    <p className="text-body-04 text-text-muted">'{submittedKeyword}'로 찾은 사람이 없어요</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {searchResults.map((person) => (
                        <FriendRow
                          key={person.memberId}
                          friend={person}
                          caption={person.relationshipStatus ? SEARCH_CAPTION[person.relationshipStatus] : hasRelationshipError ? '친구 관계를 확인하지 못했어요' : '친구 관계를 확인하는 중이에요'}
                        >
                          {person.relationshipStatus === 'NONE' && (
                            <button
                              type="button"
                              disabled={pendingId === person.memberId}
                              onClick={() => handleSendRequest(person.memberId)}
                              style={{ clipPath: pixelBox(2) }}
                              className={`${ACTION_BUTTON} bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50`}
                            >
                              친구 추가
                            </button>
                          )}
                          {person.relationshipStatus === 'REQUEST_RECEIVED' && (
                            <button
                              type="button"
                              disabled={pendingId === person.memberId}
                              onClick={() =>
                                runRequestAction(person.memberId, 'accept', '친구가 됐어요!')
                              }
                              style={{ clipPath: pixelBox(2) }}
                              className={`${ACTION_BUTTON} bg-primary text-white hover:bg-primary/90 disabled:bg-primary/50`}
                            >
                              수락
                            </button>
                          )}
                        </FriendRow>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {friends.length === 0 ? (
                <div
                  style={{ clipPath: pixelBox(6) }}
                  className="mt-4 flex flex-col items-center bg-primary-subtle py-14 text-center"
                >
                  <img src={MASCOTS.basket} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                  <p className="mt-3 text-body-03 font-bold text-text-strong">아직 친구가 없어요</p>
                  <p className="mt-1 text-body-04 text-text-muted">
                    마켓에서 만난 사람에게 친구 요청을 보내보세요!
                  </p>
                </div>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {friends.map((friend) => (
                    <FriendRow key={friend.memberId} friend={friend} caption="친구">
                      {/* 목록 응답에 소유자 이름이 없어, 제목에 쓸 닉네임을 같이 넘김 */}
                      <Link
                        to={`/members/${friend.memberId}/item-dex`}
                        state={{ nickname: friend.nickname }}
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong`}
                      >
                        물건 도감
                      </Link>
                      <button
                        type="button"
                        disabled={pendingId === friend.memberId}
                        onClick={() => setDeleteTarget(friend)}
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary-subtle text-text-muted hover:bg-red-100 hover:text-red-600`}
                      >
                        친구 삭제
                      </button>
                    </FriendRow>
                  ))}
                </ul>
              )}
            </section>

          </>
        )}
      </div>

      {/* 친구 삭제 확인 */}
      <Modal
        open={deleteTarget !== null}
        onRequestClose={() => setDeleteTarget(null)}
        labelledBy="delete-friend-title"
        size="sm"
      >
        <div className="py-6 text-center">
          <img src={MASCOTS.surprised} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
          <h2 id="delete-friend-title" className="mt-6 text-head-03 font-bold text-text-strong">
            친구를 삭제할까요?
          </h2>
          {/* 닉네임은 최대 20자까지 올 수 있어 제목(24px)에 두면 이름 중간에서 잘림.
              본문(14px)으로 내려 길어져도 자연스럽게 줄바꿈되게 함 */}
          <p className="mt-2 text-body-04 text-text-muted">
            <span className="font-bold text-text-strong">{deleteTarget?.nickname}</span>
            님과의 친구 관계가 사라져요. 다시 친구가 되려면 요청을 새로 보내야 해요.
          </p>
          {/* 참여자 모달과 같은 배치 — 주요 동작을 왼쪽에 */}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => handleDelete()}
              disabled={deleteFriendshipMutation.isPending}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-red-500 py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:bg-red-300"
            >
              {deleteFriendshipMutation.isPending ? '삭제하는 중...' : '삭제하기'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
            >
              취소
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
