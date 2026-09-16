import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { ProductDetail, ProductSummary } from '../model/types'

// 백엔드 최대 size가 100
const LIST_SIZE = 100

export const productKeys = {
  all: ['products'] as const,
  market: (marketId: number) => [...productKeys.all, 'market', marketId] as const,
  detail: (itemId: number) => [...productKeys.all, 'detail', itemId] as const,
}

const isValidId = (id: number) => Number.isInteger(id) && id > 0

// 권한 없음·없는 상품은 다시 시도해도 결과가 같으니 재시도하지 않음
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
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
    enabled: isValidId(marketId),
    retry: retryUnlessClientError,
  })
}

export function getProduct(itemId: number) {
  return api.get<ProductDetail>(`/api/v1/items/${itemId}`)
}

export function useProduct(itemId: number) {
  return useQuery({
    queryKey: productKeys.detail(itemId),
    queryFn: async () => (await getProduct(itemId)).data,
    enabled: isValidId(itemId),
    retry: retryUnlessClientError,
  })
}
