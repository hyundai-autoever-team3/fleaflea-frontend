import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { friendKeys } from '../../../entities/friend'
import { marketKeys } from '../../../entities/market'
import { api } from '../../../shared/api/axios'

// POST /api/v1/members/{memberId}/friend-requests
export function sendFriendRequest(memberId: number) {
  return api.post(`/api/v1/members/${memberId}/friend-requests`)
}

// POST /api/v1/friend-requests/{requesterId}/accept — 내가 받은 요청을 수락
export function acceptFriendRequest(requesterId: number) {
  return api.post(`/api/v1/friend-requests/${requesterId}/accept`)
}

// POST /api/v1/friend-requests/{requesterId}/reject — 내가 받은 요청을 거절
export function rejectFriendRequest(requesterId: number) {
  return api.post(`/api/v1/friend-requests/${requesterId}/reject`)
}

// POST /api/v1/friend-requests/{addresseeId}/cancel — 내가 보낸 요청을 취소
export function cancelFriendRequest(addresseeId: number) {
  return api.post(`/api/v1/friend-requests/${addresseeId}/cancel`)
}

// DELETE /api/v1/friendships/{friendshipId}
export function deleteFriendship(friendshipId: number) {
  return api.delete(`/api/v1/friendships/${friendshipId}`)
}

export type FriendRequestAction = 'accept' | 'reject' | 'cancel'

const RESPOND_CALL: Record<FriendRequestAction, (memberId: number) => Promise<unknown>> = {
  accept: acceptFriendRequest,
  reject: rejectFriendRequest,
  cancel: cancelFriendRequest,
}

export const FRIEND_REQUEST_ACTION_LABEL: Record<FriendRequestAction, '수락' | '거절' | '취소'> = {
  accept: '수락',
  reject: '거절',
  cancel: '취소',
}

// 친구 관계는 친구 목록·요청·검색 결과와 마켓 참여자 정보에 함께 반영된다.
function useFriendMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    // 목록 갱신까지 대기해 처리한 요청의 버튼이 잠시 다시 활성화되는 것을 막는다.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: friendKeys.all }),
        queryClient.invalidateQueries({ queryKey: marketKeys.all }),
      ]).catch(() => undefined)
    },
  })
}

export function useSendFriendRequest() {
  return useFriendMutation(sendFriendRequest)
}

export function useRespondToFriendRequest() {
  return useFriendMutation(
    ({ action, memberId }: { action: FriendRequestAction; memberId: number }) =>
      RESPOND_CALL[action](memberId),
  )
}

export function useDeleteFriendship() {
  return useFriendMutation(deleteFriendship)
}

export function getSendFriendRequestErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '나에게는 친구 요청을 보낼 수 없어요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '회원을 찾을 수 없어요.'
    case 409:
      return '이미 친구이거나 요청을 보낸 상대예요.'
    default:
      return '친구 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

// 수락·거절·취소가 공유하는 오류를 동작별 문구로 표시한다.
export function getFriendRequestActionErrorMessage(
  error: unknown,
  action: '수락' | '거절' | '취소',
) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '이미 처리된 요청이에요.'
    default:
      return `친구 요청을 ${action}하지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
}

export function getDeleteFriendshipErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '이미 삭제된 친구예요.'
    default:
      return '친구를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
