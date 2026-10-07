import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { ProductDetail, ProductSummary } from '../model/types'

// 서버가 허용하는 페이지당 최대 조회 개수.
const LIST_SIZE = 100

export const productKeys = {
  all: ['products'] as const,
  market: (marketId: number) => [...productKeys.all, 'market', marketId] as const,
  detail: (itemId: number) => [...productKeys.all, 'detail', itemId] as const,
}

const isValidId = (id: number) => Number.isInteger(id) && id > 0

// 인증·권한·대상 오류는 자동 재시도로 해결되지 않는다.
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

export function getMarketProducts(
  marketId: number,
  page = 0,
  size = LIST_SIZE,
  signal?: AbortSignal,
) {
  return api.get<PageResponse<ProductSummary>>(`/api/v1/markets/${marketId}/items`, {
    params: { page, size },
    signal,
  })
}

// 페이지 조회 도중 상품 순서가 바뀔 수 있어 itemId로 중복을 제거한 뒤 정렬한다.
async function getAllMarketProducts(marketId: number, signal?: AbortSignal) {
  const firstPage = (await getMarketProducts(marketId, 0, LIST_SIZE, signal)).data
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.totalPages - 1) }, (_, index) =>
      getMarketProducts(marketId, index + 1, LIST_SIZE, signal).then(
        (response) => response.data.content,
      ),
    ),
  )
  const products = [firstPage.content, ...remainingPages].flat()

  return [...new Map(products.map((product) => [product.itemId, product])).values()].sort(
    (left, right) => right.createdAt.localeCompare(left.createdAt) || right.itemId - left.itemId,
  )
}

export function useMarketProducts(marketId: number) {
  return useQuery({
    queryKey: productKeys.market(marketId),
    queryFn: ({ signal }) => getAllMarketProducts(marketId, signal),
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
