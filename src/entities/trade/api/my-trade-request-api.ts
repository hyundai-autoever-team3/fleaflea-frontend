import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { TradeRequestStatus } from '../model/types'

export type TradeRequestKind = 'ITEM' | 'COLLECTION' | 'BEG'

export interface TradeRequestParty {
  memberId: number
  nickname: string
  profileImageUrl: string | null
}

// targetItemId는 ITEM 요청에서 상품 ID, COLLECTION·BEG 요청에서 도감 물건 ID다.
// tradeType은 ITEM에서 SALE|GIVEAWAY|RENTAL, COLLECTION에서 RENTAL|EXCHANGE, BEG에서 null이다.
export interface TradeRequestListItem {
  requestType: TradeRequestKind
  requestId: number
  targetItemId: number
  targetItemTitle: string
  tradeType: string | null
  status: TradeRequestStatus
  owner: TradeRequestParty
  requester: TradeRequestParty
  imageUrl: string | null
  createdAt: string
}

// API 응답에 없는 요청자 여부는 조회 방향(received/sent)으로 보완한다.
export interface MyTradeRequest extends TradeRequestListItem {
  isRequester: boolean
}

export const myTradeRequestKeys = {
  all: ['my-trade-requests'] as const,
  detail: (requestType: TradeRequestKind, requestId: number) =>
    [...myTradeRequestKeys.all, 'detail', requestType, requestId] as const,
}

export function getTradeRequests(direction: 'received' | 'sent', signal?: AbortSignal) {
  return api.get<TradeRequestListItem[]>('/api/v1/trade-requests', {
    params: { direction },
    signal,
  })
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 400 || status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

// 진행 중·지난 거래에는 양쪽 요청이 필요하므로 받은 요청과 보낸 요청을 함께 조회한다.
async function getMyTradeRequests(signal?: AbortSignal): Promise<MyTradeRequest[]> {
  const [received, sent] = await Promise.all([
    getTradeRequests('received', signal),
    getTradeRequests('sent', signal),
  ])

  return [
    ...received.data.map((request) => ({ ...request, isRequester: false })),
    ...sent.data.map((request) => ({ ...request, isRequester: true })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function useMyTradeRequests() {
  return useQuery({
    queryKey: myTradeRequestKeys.all,
    queryFn: ({ signal }) => getMyTradeRequests(signal),
    retry: retryUnlessClientError,
    // 상대방이나 다른 탭에서 처리할 수 있으므로, 재방문·탭 복귀 시 최신 상태를 확인한다.
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
