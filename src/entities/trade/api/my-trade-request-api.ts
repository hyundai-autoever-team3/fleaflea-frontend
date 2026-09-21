import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { TradeRequestStatus } from '../model/types'

// 백엔드 TradeRequestListService가 넣는 값 (ITEM/COLLECTION/BEG)
export type TradeRequestKind = 'ITEM' | 'COLLECTION' | 'BEG'

export interface TradeRequestParty {
  memberId: number
  nickname: string
  profileImageUrl: string | null
}

// GET /api/v1/trade-requests 한 줄. 세 종류가 같은 모양으로 섞여 온다.
// targetItemId는 ITEM이면 상품 id, COLLECTION·BEG면 도감 물건 id다.
// tradeType은 ITEM이면 SALE|GIVEAWAY|RENTAL, COLLECTION이면 RENTAL|EXCHANGE, BEG면 null
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

// 통합 목록에는 "내가 요청한 쪽인지"가 없어, 어느 방향으로 물어봤는지로 채운다
export interface MyTradeRequest extends TradeRequestListItem {
  isRequester: boolean
}

export const myTradeRequestKeys = {
  all: ['my-trade-requests'] as const,
  detail: (requestType: TradeRequestKind, requestId: number) =>
    [...myTradeRequestKeys.all, 'detail', requestType, requestId] as const,
}

export function getTradeRequests(direction: 'received' | 'sent', signal?: AbortSignal) {
  return api.get<TradeRequestListItem[]>('/api/v1/trade-requests', { params: { direction }, signal })
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

// 받은 요청과 보낸 요청을 함께 받아 한 목록으로 합친다.
// 진행 중·지난 거래는 양쪽에 걸쳐 있어 한쪽만 봐서는 만들 수 없다
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
