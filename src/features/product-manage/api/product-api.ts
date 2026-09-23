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
export function createProduct(marketId: number, { collectionItemId, title, description, tradeType, price, image }: CreateProductPayload) {
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
export function updateProduct(itemId: number, { title, description, tradeType, price, image }: CreateProductPayload) {
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

// 상품을 올리고 고치고 지우면 그 마켓의 상품 목록과 상세가 같이 달라진다.
// 무효화를 화면마다 적어 두면 한 곳만 빠뜨려도 낡은 목록이 남으므로 여기에 모은다.
// 새 목록이 도착할 때까지 기다렸다 끝내야 화면을 옮긴 뒤에도 바뀐 내용이 보인다
async function refreshMarketProducts(
  queryClient: ReturnType<typeof useQueryClient>,
  marketId: number,
  itemId?: number,
) {
  const refreshing = [queryClient.invalidateQueries({ queryKey: productKeys.market(marketId) })]
  if (itemId !== undefined) refreshing.push(queryClient.invalidateQueries({ queryKey: productKeys.detail(itemId) }))
  await Promise.all(refreshing.map((task) => task.catch(() => undefined)))
}

export function useCreateProduct(marketId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProductPayload) => (await createProduct(marketId, payload)).data,
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
      // 상품을 지우면 그 상품에 오간 거래 요청과 알림도 서버에서 함께 사라진다.
      // 내 거래 목록과 알림을 그대로 두면 없어진 상품의 줄이 남는다
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

// 지난 요청이 남아 있어도 이제는 지울 수 있고, 막히는 건 상품의 상태뿐이다.
// 진행 중과 완료는 막히는 이유가 달라 코드로 갈라 안내한다
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
