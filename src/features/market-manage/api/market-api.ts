import { useMutation, useQueryClient } from '@tanstack/react-query'

import { marketKeys } from '../../../entities/market'
import { api } from '../../../shared/api/axios'

export interface CreateMarketPayload {
  title: string
  description?: string
  coverImage?: File | null
}

export interface CreateMarketResponse {
  marketId: number
  hostId: number
  title: string
  description: string | null
  coverImageUrl: string | null
  inviteCode: string
}

export function createMarket({ title, description, coverImage }: CreateMarketPayload) {
  const formData = new FormData()
  formData.append('title', title)
  if (description) formData.append('description', description)
  if (coverImage) formData.append('coverImage', coverImage)

  return api.post<CreateMarketResponse>('/api/v1/markets', formData)
}

// 개설자도 참여자로 등록되므로 생성 후 내 마켓 목록을 갱신한다.
export function useCreateMarket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateMarketPayload) => (await createMarket(payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketKeys.all }).catch(() => undefined)
    },
  })
}
