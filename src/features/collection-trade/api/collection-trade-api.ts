import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'

// 도감 거래는 대여와 교환 두 가지. 교환만 내 도감 물건을 하나 걸고, 대여는 상대 물건을 빌리기만 한다
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

// 교환만 내 물건을 걸어 맞바꾼다. 대여는 상대 물건을 빌리는 것이라 거는 물건이 없다
// (Swagger CollectionTradeRequestCreateRequest: required는 tradeType뿐)
export interface CollectionTradePayload {
  tradeType: CollectionTradeType
  offerCollectionItemId?: number
}

export function createCollectionTradeRequest(collectionItemId: number, payload: CollectionTradePayload) {
  return api.post<CollectionTradeRequest>(`/api/v1/collection-items/${collectionItemId}/trade-requests`, payload)
}

export function createBegRequest(collectionItemId: number, story: string) {
  return api.post<BegRequest>(`/api/v1/collection-items/${collectionItemId}/beg-requests`, { story })
}

export function useCreateCollectionTradeRequest(collectionItemId: number) {
  return useMutation({
    mutationFn: (payload: CollectionTradePayload) =>
      createCollectionTradeRequest(collectionItemId, payload).then((response) => response.data),
  })
}

export function useCreateBegRequest(collectionItemId: number) {
  return useMutation({
    mutationFn: (story: string) => createBegRequest(collectionItemId, story).then((response) => response.data),
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
