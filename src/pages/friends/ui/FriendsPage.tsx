import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { friendKeys, useFriendRequests, useMyFriends } from '../../../entities/friend'
import type { Friendship } from '../../../entities/friend'
import {
  acceptFriendRequest,
  cancelFriendRequest,
  deleteFriendship,
  getDeleteFriendshipErrorMessage,
  getFriendRequestActionErrorMessage,
  rejectFriendRequest,
} from '../../../features/friend-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

const ACTION_BUTTON = 'flex h-9 items-center px-3 text-xs font-bold transition-colors duration-200'

function Avatar({ profileImageUrl }: { profileImageUrl: string | null }) {
  return (
    <img
      src={profileImageUrl || MASCOTS.default}
      alt=""
      style={{ clipPath: pixelBox(2) }}
      className="size-12 shrink-0 bg-primary-subtle object-cover [image-rendering:pixelated]"
    />
  )
}

// 한 줄 = 아바타 + 닉네임(+ 보조 문구) + 오른쪽 동작 버튼들
function FriendRow({
  friend,
  caption,
  children,
}: {
  friend: Friendship
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
        <div className="flex shrink-0 gap-2">{children}</div>
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
  const queryClient = useQueryClient()
  const friendsQuery = useMyFriends()
  const receivedQuery = useFriendRequests('RECEIVED')
  const sentQuery = useFriendRequests('SENT')

  const [pendingId, setPendingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Friendship | null>(null)

  const friends = friendsQuery.data ?? []
  const received = receivedQuery.data ?? []
  const sent = sentQuery.data ?? []

  function refreshAll() {
    void queryClient.invalidateQueries({ queryKey: friendKeys.all })
  }

  // 수락·거절·취소는 처리 흐름이 같아 한 곳에서 실행하고, 문구만 동작에 맞춰 바꿈
  async function runRequestAction(
    memberId: number,
    action: '수락' | '거절' | '취소',
    request: (id: number) => Promise<unknown>,
    successMessage: string,
  ) {
    setPendingId(memberId)
    setError('')
    try {
      await request(memberId)
      refreshAll()
      useToastStore.getState().showToast(successMessage)
    } catch (actionError) {
      setError(getFriendRequestActionErrorMessage(actionError, action))
    } finally {
      setPendingId(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setPendingId(deleteTarget.memberId)
    setError('')
    try {
      await deleteFriendship(deleteTarget.friendshipId)
      refreshAll()
      useToastStore.getState().showToast('친구를 삭제했어요')
      setDeleteTarget(null)
    } catch (deleteError) {
      setError(getDeleteFriendshipErrorMessage(deleteError))
    } finally {
      setPendingId(null)
    }
  }

  const isLoading = friendsQuery.isPending || receivedQuery.isPending || sentQuery.isPending

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <h1 className="text-head-02 font-bold text-text-strong">친구</h1>

        {/* 안내 — 처음 들어온 사람이 바로 보도록 제목 바로 아래에 */}
        <div
          style={{ clipPath: pixelBox(6) }}
          className="mt-4 flex items-start gap-3 bg-primary-subtle px-5 py-4"
        >
          <img src={MASCOTS.wink} alt="" className="h-10 shrink-0 object-contain [image-rendering:pixelated]" />
          <div>
            <p className="text-body-03 font-bold text-text-strong">친구가 되는 방법</p>
            <p className="mt-1 text-body-04 text-text-muted">
              마켓 참여자 목록에서 친구 요청을 보내면 상대에게 알림이 가요. 상대가 수락하면 친구가 돼요.
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-body-04 text-red-600">{error}</p>}

        {isLoading ? (
          <p className="py-24 text-center text-body-03 text-text-muted">친구 목록을 불러오는 중이에요...</p>
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
                          void runRequestAction(friend.memberId, '수락', acceptFriendRequest, '친구가 됐어요!')
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
                          void runRequestAction(friend.memberId, '거절', rejectFriendRequest, '요청을 거절했어요')
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
                          void runRequestAction(friend.memberId, '취소', cancelFriendRequest, '요청을 취소했어요')
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
                      {/* 남의 도감을 여는 경로가 아직 없어 비활성 — 도감 화면이 생기면 연결 */}
                      <button
                        type="button"
                        disabled
                        style={{ clipPath: pixelBox(2) }}
                        className={`${ACTION_BUTTON} bg-primary-subtle text-text-muted disabled:opacity-50`}
                      >
                        물건 도감
                      </button>
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
      <Modal open={deleteTarget !== null} onRequestClose={() => setDeleteTarget(null)} labelledBy="delete-friend-title">
        <div className="py-8 text-center">
          <img src={MASCOTS.surprised} alt="" className="mx-auto h-28 object-contain [image-rendering:pixelated]" />
          <h2 id="delete-friend-title" className="mt-6 text-head-03 font-bold text-text-strong">
            {deleteTarget?.nickname}님을 친구에서 삭제할까요?
          </h2>
          <p className="mt-2 text-body-03 text-text-muted">다시 친구가 되려면 요청을 새로 보내야 해요.</p>
          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-primary-subtle py-4 text-body-03 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={pendingId !== null}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-red-500 py-4 text-body-03 font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:bg-red-300"
            >
              {pendingId !== null ? '삭제하는 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
