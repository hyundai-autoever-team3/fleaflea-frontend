import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
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

// GET /api/v1/members/search — 닉네임으로 회원 한 명을 조회
export function searchMembers(nickname: string) {
  return api.get<MemberSearchResult>('/api/v1/members/search', {
    params: { nickname },
  })
}

export function useMemberSearch(nickname: string) {
  return useQuery({
    queryKey: friendKeys.search(nickname),
    queryFn: async () => {
      try {
        const { data } = await searchMembers(nickname)
        return [data]
      } catch (error) {
        // Swagger: 일치하는 회원이 없으면 404. 기존 화면의 빈 목록 상태로 연결.
        if (isAxiosError(error) && error.response?.status === 404) return []
        throw error
      }
    },
    enabled: nickname.length > 0,
    retry: retryUnlessClientError,
  })
}

export function getMemberSearchErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400) return '검색할 닉네임을 입력해 주세요.'
  if (status === 401) return '로그인이 필요해요. 다시 로그인해 주세요.'
  return '검색하지 못했어요. 잠시 후 다시 시도해 주세요.'
}
