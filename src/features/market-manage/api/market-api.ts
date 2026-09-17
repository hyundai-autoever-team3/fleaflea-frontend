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

  return api.post<CreateMarketResponse>('/markets', formData)
}
