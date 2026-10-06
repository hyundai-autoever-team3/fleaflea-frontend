import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { myTradeRequestKeys } from '../../../entities/trade'
import { api } from '../../../shared/api/axios'

// 교환은 내 도감 물건을 제공하고, 대여는 상대 물건만 빌린다.
export type CollectionTradeType = 'RENTAL' | 'EXCHANGE'

export const TRADE_TYPE_LABEL: Record<CollectionTradeType, string> = {
  RENTAL: '대여',
  EXCHANGE: '교환',
}

// Swagger CollectionTradeRequestResponse
export interface CollectionTradeRequest {
  collectionTradeRequestId: number
  collectionItemId: number
  collectionItemTitle: string
  requesterId: number
  requesterNickname: string
  offerCollectionItemId: number
  offerCollectionItemTitle: string
  tradeType: CollectionTradeType
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  createdAt: string
}

// Swagger BeggingResponse
export interface BegRequest {
  begRequestId: number
  collectionItemId: number
  applicantId: number
  story: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

// offerCollectionItemId는 교환 요청에만 포함한다.
export interface CollectionTradePayload {
  tradeType: CollectionTradeType
  offerCollectionItemId?: number
}

export function createCollectionTradeRequest(
  collectionItemId: number,
  payload: CollectionTradePayload,
) {
  return api.post<CollectionTradeRequest>(
    `/api/v1/collection-items/${collectionItemId}/trade-requests`,
    payload,
  )
}

export function createBegRequest(collectionItemId: number, story: string) {
  return api.post<BegRequest>(`/api/v1/collection-items/${collectionItemId}/beg-requests`, {
    story,
  })
}

// 새 요청을 거래 목록에 반영한다. 조회 실패가 요청 성공을 취소하지는 않는다.
function refreshMyTradeRequests(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }).catch(() => undefined)
}

export function useCreateCollectionTradeRequest(collectionItemId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CollectionTradePayload) =>
      createCollectionTradeRequest(collectionItemId, payload).then((response) => response.data),
    onSuccess: () => refreshMyTradeRequests(queryClient),
  })
}

export function useCreateBegRequest(collectionItemId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (story: string) =>
      createBegRequest(collectionItemId, story).then((response) => response.data),
    onSuccess: () => refreshMyTradeRequests(queryClient),
  })
}

export function getTradeRequestErrorMessage(error: unknown, tradeType: CollectionTradeType) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '요청 내용을 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '이 물건에는 요청을 보낼 수 없어요.'
    case 404:
      return '물건을 찾을 수 없어요. 이미 삭제되었을 수 있어요.'
    case 409:
      return '이미 보낸 요청이 있어요.'
    default:
      return `${TRADE_TYPE_LABEL[tradeType]} 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
}

export function getBegRequestErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '사연을 입력해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '이 물건에는 구걸할 수 없어요.'
    case 404:
      return '물건을 찾을 수 없어요. 이미 삭제되었을 수 있어요.'
    case 409:
      return '이미 보낸 구걸 요청이 있어요.'
    default:
      return '구걸 요청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
