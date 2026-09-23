import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { collectionKeys } from '../../../entities/collection-item'
import { productKeys } from '../../../entities/product'
import { myTradeRequestKeys, type MyTradeRequest, type TradeRequestKind } from '../../../entities/trade'
import { api } from '../../../shared/api/axios'

export type TradeAction = 'accept' | 'reject' | 'cancel' | 'complete'

// 종류마다 경로가 다르다. 동작 이름은 셋 다 같다
const BASE_PATH: Record<TradeRequestKind, string> = {
  ITEM: '/api/v1/item-trade-requests',
  COLLECTION: '/api/v1/collection-trade-requests',
  BEG: '/api/v1/beg-requests',
}

export function actOnTradeRequest(kind: TradeRequestKind, requestId: number, action: TradeAction) {
  return api.post<void>(`${BASE_PATH[kind]}/${requestId}/${action}`)
}

// 누가 무엇을 누를 수 있는지는 백엔드 검증과 정확히 맞춰야 한다.
// 완료는 상품·도감·구걸 모두 요청자만 할 수 있다.
// 누를 수 없는 버튼을 그리면 403만 돌아오므로 여기서 걸러낸다
export function availableActions({ status, isRequester }: MyTradeRequest): TradeAction[] {
  if (status === 'PENDING') return isRequester ? ['cancel'] : ['accept', 'reject']
  if (status !== 'ACCEPTED') return []
  return isRequester ? ['complete'] : []
}

export function useTradeAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, requestId, action }: { kind: TradeRequestKind; requestId: number; action: TradeAction }) =>
      actOnTradeRequest(kind, requestId, action),
    onSuccess: async (_response, { kind }) => {
      // 목록의 상태 배지와 상품·도감 화면의 버튼이 함께 바뀌어야 한다
      const refreshing = [
        queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['trade-requests'] }),
      ]
      // 상품은 수락·완료 후 목록과 상세의 거래 상태를 다시 받는다.
      // 도감 거래도 관련 목록과 상세를 함께 갱신한다.
      if (kind === 'ITEM') {
        refreshing.push(queryClient.invalidateQueries({ queryKey: productKeys.all }))
      } else {
        refreshing.push(queryClient.invalidateQueries({ queryKey: collectionKeys.all }))
      }
      // 새 목록이 도착할 때까지 기다렸다 끝낸다. 기다리지 않으면 버튼이 '처리 중'에서
      // 원래 모습으로 잠깐 돌아왔다가 그제서야 줄이 사라져 깜박이는 것처럼 보인다.
      // 목록을 다시 받는 데 실패해도 거래 자체는 성공이므로 실패로 바꾸지 않는다
      await Promise.all(refreshing.map((task) => task.catch(() => undefined)))
    },
    // 권한·존재 여부·상태가 바뀌었을 수 있으므로 목록을 다시 확인한다.
    // 구걸의 완료 상태 불일치는 다른 거래의 409와 달리 400으로 온다.
    onError: async (error) => {
      if (!isAxiosError<{ code?: string }>(error)) return
      const status = error.response?.status
      const isBegStatusMismatch = status === 400 && error.response?.data?.code === 'BEG_REQUEST_NOT_ACCEPTED'
      if (status !== 403 && status !== 404 && status !== 409 && !isBegStatusMismatch) return
      await queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }).catch(() => undefined)
    },
  })
}

const ACTION_LABEL: Record<TradeAction, string> = {
  accept: '수락',
  reject: '거절',
  cancel: '취소',
  complete: '완료',
}

export function getTradeActionErrorMessage(error: unknown, action: TradeAction) {
  const response = isAxiosError<{ code?: string }>(error) ? error.response : undefined
  // 같은 HTTP 상태여도 수락 전·완료 후·중복 확인 등 원인이 다르다.
  // Swagger 등록 여부와 별개로 서버가 반환하는 code를 기준으로 안내한다.
  switch (response?.data?.code) {
    case 'COLLECTION_TRADE_INVALID_STATUS':
    case 'TRADE_REQUEST_INVALID_STATUS':
      return `현재 거래 상태에서는 ${ACTION_LABEL[action]}할 수 없어요. 거래 목록을 확인해 주세요.`
    case 'TRADE_REQUEST_NOT_ACCEPTED':
    case 'BEG_REQUEST_NOT_ACCEPTED':
      return '수락된 거래만 완료할 수 있어요. 현재 거래 상태를 확인해 주세요.'
    case 'TRADE_REQUEST_NOT_PENDING':
    case 'BEG_REQUEST_NOT_PENDING':
      return `수락 대기 중인 요청만 ${ACTION_LABEL[action]}할 수 있어요. 현재 거래 상태를 확인해 주세요.`
    case 'COLLECTION_TRADE_ALREADY_CONFIRMED':
    case 'TRADE_REQUEST_ALREADY_CONFIRMED':
    case 'BEG_REQUEST_ALREADY_COMPLETED':
      return '이미 완료 처리된 거래예요. 거래 목록을 확인해 주세요.'
  }

  const status = response?.status
  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return `이 거래를 ${ACTION_LABEL[action]}할 수 있는 사람이 아니에요.`
    case 404:
      return '거래 요청을 찾을 수 없어요.'
    case 409:
      return `현재 거래 상태에서는 ${ACTION_LABEL[action]}할 수 없어요. 거래 목록을 확인해 주세요.`
    default:
      return `거래를 ${ACTION_LABEL[action]}하지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
}
