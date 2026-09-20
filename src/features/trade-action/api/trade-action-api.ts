import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { collectionKeys } from '../../../entities/collection-item'
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
    onSuccess: async (_response, { kind }) => {
      // 목록의 상태 배지와 상품·도감 화면의 버튼이 함께 바뀌어야 한다
      const refreshing = [
        queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['trade-requests'] }),
      ]
      // 도감 물건은 거래가 끝나면 주인이 바뀌어 내 도감에서 빠진다.
      // 받아둔 목록은 1분간 그대로 쓰이므로(query-client의 staleTime),
      // 여기서 비워주지 않으면 넘긴 물건이 한동안 도감에 남아 보인다
      if (kind !== 'ITEM') {
        refreshing.push(queryClient.invalidateQueries({ queryKey: collectionKeys.all }))
      }
      // 새 목록이 도착할 때까지 기다렸다 끝낸다. 기다리지 않으면 버튼이 '처리 중'에서
      // 원래 모습으로 잠깐 돌아왔다가 그제서야 줄이 사라져 깜박이는 것처럼 보인다.
      // 목록을 다시 받는 데 실패해도 거래 자체는 성공이므로 실패로 바꾸지 않는다
      await Promise.all(refreshing.map((task) => task.catch(() => undefined)))
    },
    // 상대가 먼저 처리했거나 이미 끝난 거래를 누른 것이다. 내 화면이 낡았다는 뜻이므로
    // 목록을 다시 받아 맞춘다. 그러지 않으면 누를 수 없는 버튼이 계속 남아 같은 실패가 반복된다
    onError: async (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status !== 403 && status !== 404 && status !== 409) return
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
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return `이 거래를 ${ACTION_LABEL[action]}할 수 있는 사람이 아니에요.`
    case 404:
      return '거래 요청을 찾을 수 없어요.'
    case 409:
      return `이미 처리된 거래라 ${ACTION_LABEL[action]}할 수 없어요. 목록을 새로 받아왔어요.`
    default:
      return `거래를 ${ACTION_LABEL[action]}하지 못했어요. 잠시 후 다시 시도해 주세요.`
  }
}
