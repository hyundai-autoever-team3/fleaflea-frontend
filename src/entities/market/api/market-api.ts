import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type {
  MarketDetail,
  MarketInvitation,
  MarketMember,
  MarketSummary,
  PageResponse,
} from '../model/types'

// 클라이언트 검색에 사용할 목록을 최대 100개 조회한다.
const LIST_SIZE = 100

export const marketKeys = {
  all: ['markets'] as const,
  list: () => [...marketKeys.all, 'list'] as const,
  detail: (marketId: number) => [...marketKeys.all, 'detail', marketId] as const,
  members: (marketId: number) => [...marketKeys.all, 'detail', marketId, 'members'] as const,
}

// 개설자도 참여자에 포함되므로 joined 조회에 직접 만든 마켓이 함께 반환된다.
export function getMyMarkets() {
  return api.get<PageResponse<MarketSummary>>('/api/v1/markets', {
    params: { scope: 'joined', page: 0, size: LIST_SIZE },
  })
}

export function getMarket(marketId: number) {
  return api.get<MarketDetail>(`/api/v1/markets/${marketId}`)
}

export function getMarketMembers(marketId: number) {
  return api.get<PageResponse<MarketMember>>(`/api/v1/markets/${marketId}/members`, {
    params: { page: 0, size: LIST_SIZE },
  })
}

const isValidMarketId = (marketId: number) => Number.isInteger(marketId) && marketId > 0

// 접근할 수 없거나 존재하지 않는 마켓은 자동 재시도하지 않는다.
function retryUnlessForbiddenOrMissing(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 403 || status === 404) return false

  return failureCount < 3
}

export function useMyMarkets() {
  return useQuery({
    queryKey: marketKeys.list(),
    queryFn: async () => (await getMyMarkets()).data.content,
  })
}

export function useMarket(marketId: number) {
  return useQuery({
    queryKey: marketKeys.detail(marketId),
    queryFn: async () => (await getMarket(marketId)).data,
    enabled: isValidMarketId(marketId),
    retry: retryUnlessForbiddenOrMissing,
  })
}

export function useMarketMembers(marketId: number) {
  return useQuery({
    queryKey: marketKeys.members(marketId),
    queryFn: async () => (await getMarketMembers(marketId)).data.content,
    enabled: isValidMarketId(marketId),
    retry: retryUnlessForbiddenOrMissing,
  })
}

export function getMarketInvitation(marketId: number) {
  return api.get<MarketInvitation>(`/api/v1/markets/${marketId}/invitation`)
}

// 초대 코드는 호스트 전용이므로 호출부에서 호스트 여부를 enabled로 전달한다.
export function useMarketInvitation(marketId: number, enabled: boolean) {
  return useQuery({
    queryKey: [...marketKeys.detail(marketId), 'invitation'],
    queryFn: async () => (await getMarketInvitation(marketId)).data,
    enabled: enabled && isValidMarketId(marketId),
    retry: retryUnlessForbiddenOrMissing,
  })
}
