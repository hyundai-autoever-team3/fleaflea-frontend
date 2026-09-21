import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { TradeRequestStatus } from '../model/types'
import { myTradeRequestKeys, type TradeRequestKind, type TradeRequestParty } from './my-trade-request-api'

// 교환·구걸에서 요청자가 대신 내놓은 도감 물건. 상품 거래에는 없다
export interface TradeRequestOfferItem {
  collectionItemId: number
  title: string
  description: string | null
  imageUrl: string | null
}

// GET /api/v1/trade-requests/{requestType}/{requestId}
// 요청 당시의 모습을 서버가 한 덩어리로 내려준다. 물건 상세와 달리 물건이 지워지거나
// 마켓을 나간 뒤에도 당사자면 볼 수 있고, 대여 기간·요청 메시지처럼
// 물건에는 없고 요청에만 있는 값이 함께 온다
export interface TradeRequestDetail {
  requestType: TradeRequestKind
  requestId: number
  targetItemId: number
  targetItemTitle: string
  targetItemDescription: string | null
  targetItemImageUrl: string | null
  // ITEM이면 SALE|GIVEAWAY|RENTAL, COLLECTION이면 RENTAL|EXCHANGE, BEG면 null
  tradeType: string | null
  price: number | null
  status: TradeRequestStatus
  owner: TradeRequestParty
  requester: TradeRequestParty
  offerItem: TradeRequestOfferItem | null
  message: string | null
  rentalStartDate: string | null
  rentalEndDate: string | null
  createdAt: string
  updatedAt: string | null
  completedAt: string | null
}

export function getTradeRequestDetail(requestType: TradeRequestKind, requestId: number) {
  return api.get<TradeRequestDetail>(`/api/v1/trade-requests/${requestType}/${requestId}`)
}

// 당사자가 아니거나(403) 없는 요청(404)은 다시 물어도 같은 답이라 재시도하지 않는다
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

export function useTradeRequestDetail(requestType: TradeRequestKind | null, requestId: number) {
  return useQuery({
    queryKey: myTradeRequestKeys.detail(requestType ?? 'ITEM', requestId),
    queryFn: async () => (await getTradeRequestDetail(requestType as TradeRequestKind, requestId)).data,
    enabled: requestType !== null && Number.isInteger(requestId) && requestId > 0,
    retry: retryUnlessClientError,
  })
}

export function getTradeRequestDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400) return '알 수 없는 거래 종류예요.'
  if (status === 403) return '내가 참여한 거래만 볼 수 있어요.'
  if (status === 404) return '거래 내역을 찾을 수 없어요.'
  return '거래 내역을 불러오지 못했어요.'
}
