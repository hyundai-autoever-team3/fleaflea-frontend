import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { ProductDetail, ProductStatus, ProductSummary } from '../model/types'

// 목록 화면에서 한 페이지에 넘기는 조건. 값이 없는 조건은 서버에 보내지 않는다
export interface MarketProductPageParams {
  page: number
  size: number
  status?: ProductStatus
  keyword?: string
}

// 페이지·전체 개수 키는 market 키 뒤에 이어 붙여, 상품을 바꾼 뒤 market 키로 무효화하면 함께 새로 받는다
export const productKeys = {
  all: ['products'] as const,
  market: (marketId: number) => [...productKeys.all, 'market', marketId] as const,
  marketPage: (marketId: number, params: MarketProductPageParams) =>
    [...productKeys.market(marketId), 'page', params] as const,
  marketTotal: (marketId: number) => [...productKeys.market(marketId), 'total'] as const,
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
  { page, size, status, keyword }: MarketProductPageParams,
  signal?: AbortSignal,
) {
  return api.get<PageResponse<ProductSummary>>(`/api/v1/markets/${marketId}/items`, {
    // axios는 undefined인 값을 주소에 싣지 않는다
    params: { page, size, status, keyword },
    signal,
  })
}

// 목록 화면용. 보이는 한 페이지만 받고, 다음 페이지가 올 때까지 이전 페이지를 그대로 보여준다
export function useMarketProductPage(marketId: number, params: MarketProductPageParams) {
  return useQuery({
    queryKey: productKeys.marketPage(marketId, params),
    queryFn: async ({ signal }) => (await getMarketProducts(marketId, params, signal)).data,
    enabled: isValidId(marketId),
    retry: retryUnlessClientError,
    placeholderData: keepPreviousData,
  })
}

// 조건과 상관없는 마켓 전체 상품 수. 검색 중에도 제목 옆 개수와 필터 줄을 유지하는 데 쓴다
export function useMarketProductTotal(marketId: number) {
  return useQuery({
    queryKey: productKeys.marketTotal(marketId),
    queryFn: async ({ signal }) =>
      (await getMarketProducts(marketId, { page: 0, size: 1 }, signal)).data.totalElements,
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
