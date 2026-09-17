import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { FriendRequestDirection, Friendship, MemberSearchResult } from '../model/types'

export const friendKeys = {
  all: ['friends'] as const,
  list: () => [...friendKeys.all, 'list'] as const,
  requests: (direction: FriendRequestDirection) => [...friendKeys.all, 'requests', direction] as const,
  search: (nickname: string) => [...friendKeys.all, 'search', nickname] as const,
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

// 아직 백엔드에 없는 API. 생기기 전까지는 404가 오고 화면에 "준비 중" 안내가 뜸
export function searchMembers(nickname: string) {
  return api.get<PageResponse<MemberSearchResult>>('/api/v1/members', {
    params: { nickname, page: 0, size: 20 },
  })
}

export function useMemberSearch(nickname: string) {
  return useQuery({
    queryKey: friendKeys.search(nickname),
    queryFn: async () => (await searchMembers(nickname)).data.content,
    enabled: nickname.length > 0,
    retry: retryUnlessClientError,
  })
}

export function getMemberSearchErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  // 검색 API가 아직 배포되지 않은 동안에는 404가 옴
  if (status === 404) return '닉네임 검색은 아직 준비 중이에요.'
  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  return '검색하지 못했어요. 잠시 후 다시 시도해 주세요.'
}
