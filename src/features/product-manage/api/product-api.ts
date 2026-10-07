import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { notificationKeys } from '../../../entities/notification'
import type { ProductSummary, TradeType } from '../../../entities/product'
import { productKeys } from '../../../entities/product'
import { myTradeRequestKeys } from '../../../entities/trade'
import { api } from '../../../shared/api/axios'

export interface CreateProductPayload {
  collectionItemId?: number
  title: string
  description: string
  tradeType: TradeType
  price: number | null
  image: File | null
}

// POST /api/v1/markets/{marketId}/items (multipart/form-data)
export function createProduct(
  marketId: number,
  { collectionItemId, title, description, tradeType, price, image }: CreateProductPayload,
) {
  const formData = new FormData()

  if (collectionItemId !== undefined) formData.append('collectionItemId', String(collectionItemId))
  formData.append('title', title)
  formData.append('description', description)
  formData.append('tradeType', tradeType)
  if (price !== null) formData.append('price', String(price))
  if (image) formData.append('image', image)

  return api.post<ProductSummary>(`/api/v1/markets/${marketId}/items`, formData)
}

// PATCH /api/v1/items/{itemId} (multipart/form-data). 보내지 않은 필드는 그대로 유지됨
export function updateProduct(
  itemId: number,
  { title, description, tradeType, price, image }: CreateProductPayload,
) {
  const formData = new FormData()

  formData.append('title', title)
  formData.append('description', description)
  formData.append('tradeType', tradeType)
  if (price !== null) formData.append('price', String(price))
  if (image) formData.append('image', image)

  return api.patch<ProductSummary>(`/api/v1/items/${itemId}`, formData)
}

export function deleteProduct(itemId: number) {
  return api.delete(`/api/v1/items/${itemId}`)
}

// 화면 이동 전에 목록과 상세를 갱신한다. 조회 실패는 저장 실패로 처리하지 않는다.
async function refreshMarketProducts(
  queryClient: ReturnType<typeof useQueryClient>,
  marketId: number,
  itemId?: number,
) {
  const refreshing = [queryClient.invalidateQueries({ queryKey: productKeys.market(marketId) })]
  if (itemId !== undefined)
    refreshing.push(queryClient.invalidateQueries({ queryKey: productKeys.detail(itemId) }))

  await Promise.all(refreshing.map((task) => task.catch(() => undefined)))
}

export function useCreateProduct(marketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) =>
      (await createProduct(marketId, payload)).data,
    onSuccess: () => refreshMarketProducts(queryClient, marketId),
  })
}

export function useUpdateProduct(itemId: number, marketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateProductPayload) => updateProduct(itemId, payload),
    onSuccess: () => refreshMarketProducts(queryClient, marketId, itemId),
  })
}

export function useDeleteProduct(itemId: number, marketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteProduct(itemId),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: productKeys.detail(itemId), exact: true })

      // 상품과 함께 삭제된 거래 요청·알림이 화면에 남지 않도록 관련 캐시도 갱신한다.
      await Promise.all([
        refreshMarketProducts(queryClient, marketId),
        queryClient.invalidateQueries({ queryKey: myTradeRequestKeys.all }).catch(() => undefined),
        queryClient.invalidateQueries({ queryKey: ['trade-requests'] }).catch(() => undefined),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }).catch(() => undefined),
      ])
    },
  })
}

export function getUpdateProductErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '입력한 상품 정보를 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '내가 올린 상품만 수정할 수 있어요.'
    case 404:
      return '상품을 찾을 수 없어요.'
    case 409:
      return '거래가 끝난 상품은 수정할 수 없어요.'
    default:
      return '상품을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

// 삭제 제한 사유는 같은 409 응답 안에서 서버 오류 코드로 구분한다.
export function getDeleteProductErrorMessage(error: unknown) {
  const response = isAxiosError<{ code?: string }>(error) ? error.response : undefined

  switch (response?.status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '내가 올린 상품만 삭제할 수 있어요.'
    case 404:
      return '상품을 찾을 수 없어요.'
    case 409:
      return response?.data?.code === 'ITEM_ALREADY_COMPLETED'
        ? '거래가 끝난 상품은 거래 내역으로 남아 삭제할 수 없어요.'
        : '거래가 진행 중인 상품은 삭제할 수 없어요.'
    default:
      return '상품을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function getCreateProductErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 400:
      return '입력한 상품 정보를 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '이 마켓에 참여한 사람만 상품을 등록할 수 있어요.'
    case 404:
      return '마켓을 찾을 수 없어요.'
    default:
      return '상품을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
