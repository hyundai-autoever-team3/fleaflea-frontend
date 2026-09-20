import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

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
// 특히 '완료'의 주체가 종류마다 다르다 —
//   상품: 요청자(validateRequester) / 도감: 주인(requireOwner) / 구걸: 신청자
// 누를 수 없는 버튼을 그리면 403만 돌아오므로 여기서 걸러낸다
export function availableActions({ requestType, status, isRequester }: MyTradeRequest): TradeAction[] {
  if (status === 'PENDING') return isRequester ? ['cancel'] : ['accept', 'reject']
  if (status !== 'ACCEPTED') return []

  const completedByOwner = requestType === 'COLLECTION'
  return completedByOwner === !isRequester ? ['complete'] : []
}

export function useTradeAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, requestId, action }: { kind: TradeRequestKind; requestId: number; action: TradeAction }) =>
      actOnTradeRequest(kind, requestId, action),
    onSuccess: () => {
      // 목록의 상태 배지와 상품·도감 화면의 버튼이 함께 바뀌어야 한다
      void queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }).catch(() => undefined)
      void queryClient.invalidateQueries({ queryKey: ['trade-requests'] }).catch(() => undefined)
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
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return `이 거래를 ${ACTION_LABEL[action]}할 수 있는 사람이 아니에요.`
    case 404:
      return '거래 요청을 찾을 수 없어요.'
    case 409:
      return `이미 처리된 거래라 ${ACTION_LABEL[action]}할 수 없어요. 새로고침해 주세요.`
    default:
      return `거래를 ${ACTION_LABEL[action]}하지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
}
