import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'

// POST /api/v1/members/{memberId}/pokes — 응답 본문 없이 204
export function pokeMember(memberId: number) {
  return api.post<void>(`/api/v1/members/${memberId}/pokes`)
}

// 상대별 일일 한도. 클라이언트는 성공 횟수를 세고, 서버는 초과 시 429를 반환한다.
export const DAILY_POKE_LIMIT = 5

// 수신자에게만 알림이 생성되므로 발신자의 목록 캐시는 갱신하지 않는다.
export function usePokeMember() {
  return useMutation({ mutationFn: pokeMember })
}

export function isPokeLimitExceeded(error: unknown) {
  return isAxiosError(error) && error.response?.status === 429
}

export function getPokeErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '나를 콕 찌를 수는 없어요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '회원을 찾을 수 없어요.'
    case 429:
      return `하루에 ${DAILY_POKE_LIMIT}번까지만 찌를 수 있어요. 내일 다시 찾아와 주세요.`
    default:
      return '콕 찌르지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
