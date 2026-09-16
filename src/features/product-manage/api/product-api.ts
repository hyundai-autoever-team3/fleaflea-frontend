import { isAxiosError } from 'axios'

import type { ProductSummary, TradeType } from '../../../entities/product'
import { api } from '../../../shared/api/axios'

export interface CreateProductPayload {
  title: string
  description: string
  tradeType: TradeType
  price: number | null
  image: File | null
}

// POST /api/v1/markets/{marketId}/items (multipart/form-data)
export function createProduct(marketId: number, { title, description, tradeType, price, image }: CreateProductPayload) {
  const formData = new FormData()
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

export function getDeleteProductErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '내가 올린 상품만 삭제할 수 있어요.'
    case 404:
      return '상품을 찾을 수 없어요.'
    case 409:
      return '거래가 진행 중인 상품은 삭제할 수 없어요.'
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
