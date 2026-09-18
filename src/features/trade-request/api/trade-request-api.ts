import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import type { TradeType } from '../../../entities/product'
import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'

// 목록은 size 최대 100 (Swagger)
const LIST_SIZE = 100

export type TradeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

// Swagger TradeRequestItemSummaryResponse
export interface TradeRequestItem {
  itemId: number
  title: string
  tradeType: TradeType
  imageUrl: string | null
}

// Swagger TradeRequestMemberSummaryResponse
export interface TradeRequestMember {
  memberId: number
  nickname: string
}

// Swagger TradeRequestSummaryResponse.
// 주의: 목록은 tradeRequestStatus·isRequester를 쓰고 상세는 status·requestedByMe를 쓴다 (백엔드 확인 필요)
export interface TradeRequestSummary {
  tradeRequestId: number
  tradeRequestStatus: TradeRequestStatus
  isRequester: boolean
  item: TradeRequestItem
  counterparty: TradeRequestMember
  createdAt: string
}

export interface TradeRequestPayload {
  message?: string
  rentalStartDate?: string
  rentalEndDate?: string
}

export const tradeRequestKeys = {
  all: ['trade-requests'] as const,
  mine: ['trade-requests', 'mine'] as const,
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

export function createTradeRequest(itemId: number, payload: TradeRequestPayload) {
  return api.post<{ tradeRequestId: number }>(`/api/v1/items/${itemId}/trade-requests`, payload)
}

export function getMyTradeRequests(page = 0, signal?: AbortSignal) {
  return api.get<PageResponse<TradeRequestSummary>>('/api/v1/item-trade-requests', {
    params: { page, size: LIST_SIZE },
    signal,
  })
}

// 목록에 상품으로 거르는 조건이 없어, 이미 보낸 요청을 찾으려면 전부 받아야 한다
async function getAllMyTradeRequests(signal?: AbortSignal) {
  const first = (await getMyTradeRequests(0, signal)).data
  const requests = [...first.content]

  for (let page = 1; page < first.totalPages; page += 1) {
    requests.push(...(await getMyTradeRequests(page, signal)).data.content)
  }

  return requests
}

export function useMyTradeRequests() {
  return useQuery({
    queryKey: tradeRequestKeys.mine,
    queryFn: ({ signal }) => getAllMyTradeRequests(signal),
    retry: retryUnlessClientError,
  })
}

// 아직 살아 있는 요청만 "이미 보냄"으로 본다. 거절·취소됐으면 다시 보낼 수 있어야 함
const OPEN_STATUSES: TradeRequestStatus[] = ['PENDING', 'ACCEPTED']

export function findMyOpenRequest(requests: TradeRequestSummary[] | undefined, itemId: number) {
  return requests?.find(
    (request) =>
      request.item.itemId === itemId && request.isRequester && OPEN_STATUSES.includes(request.tradeRequestStatus),
  )
}

export function useCreateTradeRequest(itemId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TradeRequestPayload) => createTradeRequest(itemId, payload).then((response) => response.data),
    onSuccess: () => {
      // 보낸 뒤 버튼이 '요청함'으로 바뀌도록 목록을 다시 받는다
      void queryClient.invalidateQueries({ queryKey: tradeRequestKeys.all }).catch(() => undefined)
    },
  })
}

export function getTradeRequestErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 400:
      return '요청 내용을 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '이 상품에는 요청을 보낼 수 없어요.'
    case 404:
      return '상품을 찾을 수 없어요. 이미 삭제되었을 수 있어요.'
    case 409:
      return '이미 보낸 요청이 있어요.'
    default:
      return '거래 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
