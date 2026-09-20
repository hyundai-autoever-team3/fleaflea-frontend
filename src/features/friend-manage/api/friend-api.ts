import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { friendKeys } from '../../../entities/friend'
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

// 친구를 맺고 끊는 동작은 친구 목록·받은 요청·보낸 요청·검색 결과를 한꺼번에 바꾼다.
// 무효화를 호출부마다 적어 두면 한 곳만 빠뜨려도 화면이 낡은 채로 남으므로 여기에 모은다
function useFriendMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    // 새 목록이 도착할 때까지 기다렸다 끝낸다. 기다리지 않으면 버튼이 잠깐
    // 되살아났다가 줄이 바뀌어 깜박이는 것처럼 보인다
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: friendKeys.all }).catch(() => undefined)
    },
  })
}

export function useSendFriendRequest() {
  return useFriendMutation(sendFriendRequest)
}

export function useRespondToFriendRequest() {
  return useFriendMutation(({ action, memberId }: { action: FriendRequestAction; memberId: number }) =>
    RESPOND_CALL[action](memberId))
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

// 수락·거절·취소는 응답 코드가 같아 한 함수로 처리하고, 문구만 동작에 맞춰 바꿈
export function getFriendRequestActionErrorMessage(error: unknown, action: '수락' | '거절' | '취소') {
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
