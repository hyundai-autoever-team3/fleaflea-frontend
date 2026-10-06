import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import type { TradeType } from '../../../entities/product'
import { myTradeRequestKeys } from '../../../entities/trade'
import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'

// 상품별 요청 검색을 위해 한 번에 조회할 수 있는 최대 개수를 사용한다.
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

// 거래 목록 응답은 tradeRequestStatus·isRequester 필드를 사용한다.
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

// 상품별 필터가 없어 중복 요청 확인에 필요한 전체 페이지를 조회한다.
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

// 대기·수락 상태의 요청만 중복으로 판단하고, 거절·취소 후에는 다시 요청할 수 있다.
const OPEN_STATUSES: TradeRequestStatus[] = ['PENDING', 'ACCEPTED']

export function findMyOpenRequest(requests: TradeRequestSummary[] | undefined, itemId: number) {
  return requests?.find(
    (request) =>
      request.item.itemId === itemId &&
      request.isRequester &&
      OPEN_STATUSES.includes(request.tradeRequestStatus),
  )
}

export function useCreateTradeRequest(itemId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TradeRequestPayload) =>
      createTradeRequest(itemId, payload).then((response) => response.data),
    // 마이페이지 거래 목록에 새 요청을 반영한다. 조회 실패는 요청 실패로 처리하지 않는다.
    onSuccess: async () => {
      await queryClient
        .invalidateQueries({ queryKey: myTradeRequestKeys.all })
        .catch(() => undefined)
    },
  })
}

// 동작 이름은 API 경로에 사용한다. complete는 요청자가 거래를 완료할 때 호출한다.
export type TradeRequestAction = 'accept' | 'reject' | 'cancel' | 'complete'

export function actOnTradeRequest(requestId: number, action: TradeRequestAction) {
  return api.post<void>(`/api/v1/item-trade-requests/${requestId}/${action}`)
}

export function useTradeRequestAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: number; action: TradeRequestAction }) =>
      actOnTradeRequest(requestId, action),
    onSuccess: () => {
      // 목록의 상태 배지와 상품 화면의 버튼이 함께 바뀌어야 한다
      void queryClient.invalidateQueries({ queryKey: tradeRequestKeys.all }).catch(() => undefined)
    },
  })
}

const ACTION_LABEL: Record<TradeRequestAction, string> = {
  accept: '수락',
  reject: '거절',
  cancel: '취소',
  complete: '완료',
}

export function getTradeRequestActionErrorMessage(error: unknown, action: TradeRequestAction) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      // 수락은 판매자만, 완료는 요청자만 할 수 있어 역할이 맞지 않으면 여기로 온다
      return `이 거래를 ${ACTION_LABEL[action]}할 수 있는 사람이 아니에요.`
    case 404:
      return '거래 요청을 찾을 수 없어요.'
    case 409:
      return `이미 처리된 거래라 ${ACTION_LABEL[action]}할 수 없어요. 새로고침해 주세요.`
    default:
      return `거래를 ${ACTION_LABEL[action]}하지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
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
