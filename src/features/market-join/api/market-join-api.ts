import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { marketKeys } from '../../../entities/market'
import { api } from '../../../shared/api/axios'

// POST /api/v1/market-members
export interface JoinMarketResponse {
  marketId: number
  title: string
  joinedAt: string
}

export function joinMarket(inviteCode: string) {
  return api.post<JoinMarketResponse>('/api/v1/market-members', { inviteCode })
}

// 마켓에 들어가면 내 마켓 목록이 달라진다. 무효화를 화면마다 적지 않도록 여기에 모은다
export function useJoinMarket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (inviteCode: string) => (await joinMarket(inviteCode)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketKeys.all }).catch(() => undefined)
    },
  })
}

export function isAlreadyJoinedError(error: unknown) {
  return isAxiosError(error) && error.response?.status === 409
}

export function getJoinErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 400:
      return '초대 코드를 입력해 주세요.'
    case 404:
      return '존재하지 않는 초대 코드예요. 링크를 다시 확인해 주세요.'
    case 409:
      return '이미 참여한 마켓이에요.'
    default:
      return '마켓에 참여하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
