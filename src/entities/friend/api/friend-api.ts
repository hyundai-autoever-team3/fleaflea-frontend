import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { FriendRequestDirection, Friendship } from '../model/types'

export const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  requests: (direction: FriendRequestDirection) => [...friendKeys.all, 'requests', direction] as const,
}

// 권한 없음·잘못된 값·없는 대상은 다시 시도해도 결과가 같으니 재시도하지 않음
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

// Swagger에는 목록인데도 응답이 단일 객체(FriendshipResponse)로 선언돼 있음.
// 명세 오류로 보이지만 확정 전까지 양쪽 다 받도록 방어함
function toFriendships(data: unknown): Friendship[] {
  if (Array.isArray(data)) return data as Friendship[]
  if (data !== null && typeof data === 'object') return [data as Friendship]
  return []
}

export function getMyFriends() {
  return api.get<unknown>('/api/v1/members/me/friendship')
}

export function useMyFriends() {
  return useQuery({
    queryKey: friendKeys.list(),
    queryFn: async () => toFriendships((await getMyFriends()).data),
    retry: retryUnlessClientError,
  })
}

export function getFriendRequests(direction: FriendRequestDirection) {
  return api.get<unknown>('/api/v1/friend-requests', { params: { direction } })
}

export function useFriendRequests(direction: FriendRequestDirection) {
  return useQuery({
    queryKey: friendKeys.requests(direction),
    queryFn: async () => toFriendships((await getFriendRequests(direction)).data),
    retry: retryUnlessClientError,
  })
}
