import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { ProductSummary } from '../model/types'

// 백엔드 최대 size가 100
const LIST_SIZE = 100

export const productKeys = {
  all: ['products'] as const,
  market: (marketId: number) => [...productKeys.all, 'market', marketId] as const,
}

export function getMarketProducts(marketId: number) {
  return api.get<PageResponse<ProductSummary>>(`/api/v1/markets/${marketId}/items`, {
    params: { page: 0, size: LIST_SIZE },
  })
}

export function useMarketProducts(marketId: number) {
  return useQuery({
    queryKey: productKeys.market(marketId),
    queryFn: async () => (await getMarketProducts(marketId)).data.content,
    enabled: Number.isInteger(marketId) && marketId > 0,
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === 401 || status === 403 || status === 404) return false
      return failureCount < 3
    },
  })
}
