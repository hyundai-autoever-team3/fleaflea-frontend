import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { MarketDetail, MarketMember, MarketSummary, PageResponse } from '../model/types'

// 검색을 프론트에서 하므로 한 번에 넉넉히 받아옴
const LIST_SIZE = 100

export const marketKeys = {
  all: ['markets'] as const,
  list: () => [...marketKeys.all, 'list'] as const,
  detail: (marketId: number) => [...marketKeys.all, 'detail', marketId] as const,
  members: (marketId: number) => [...marketKeys.all, 'detail', marketId, 'members'] as const,
}

// 개설자도 자동으로 참여자로 등록되므로 scope=joined 한 번으로 내가 만든 마켓까지 함께 받음
export function getMyMarkets() {
  return api.get<PageResponse<MarketSummary>>('/markets', {
    params: { scope: 'joined', page: 0, size: LIST_SIZE },
  })
}

export function getMarket(marketId: number) {
  return api.get<MarketDetail>(`/markets/${marketId}`)
}

export function getMarketMembers(marketId: number) {
  return api.get<PageResponse<MarketMember>>(`/markets/${marketId}/members`, {
    params: { page: 0, size: LIST_SIZE },
  })
}

const isValidMarketId = (marketId: number) => Number.isInteger(marketId) && marketId > 0

// 권한 없음·없는 마켓은 다시 시도해도 결과가 같으니 재시도하지 않음
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
