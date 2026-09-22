import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'

// POST /api/v1/members/{memberId}/pokes — 응답 본문 없이 204
export function pokeMember(memberId: number) {
  return api.post<void>(`/api/v1/members/${memberId}/pokes`)
}

// 한 사람에게 하루에 보낼 수 있는 횟수. 서버가 같은 값으로 막는다(POKE_LIMIT_EXCEEDED).
// 남은 횟수를 알려주는 API가 없어, 보낸 만큼 세어 두었다가 다 쓰면 버튼을 잠근다
export const DAILY_POKE_LIMIT = 5

// 보낸 콕 찌르기는 어떤 목록에도 쌓이지 않는다. 받는 사람에게 알림만 가므로
// 무효화할 캐시가 없고, 성공했다는 것만 화면에 알리면 된다
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
