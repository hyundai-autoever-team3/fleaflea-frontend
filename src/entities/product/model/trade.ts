import type { ProductStatus, ProductSummary, TradeType } from './types'

export const TRADE_TYPE_LABEL: Record<TradeType, string> = {
  SALE: '판매',
  GIVEAWAY: '나눔',
  RENTAL: '대여',
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  AVAILABLE: '거래 가능',
  IN_PROGRESS: '거래 중',
  COMPLETED: '거래 완료',
}

// 대여 가능 상태와 실제 대여 중인 상태를 구분한다.
const AVAILABLE_LABEL: Record<TradeType, string> = {
  SALE: '판매중',
  GIVEAWAY: '나눔중',
  RENTAL: '대여 가능',
}

export function getStatusTagLabel(status: ProductStatus, tradeType: TradeType) {
  if (status === 'AVAILABLE') return AVAILABLE_LABEL[tradeType]

  // 수락된 대여는 '대여 중', 판매·나눔은 인도 전인 '예약중'으로 표시한다.
  if (status === 'IN_PROGRESS') return tradeType === 'RENTAL' ? '대여 중' : '예약중'

  if (tradeType === 'RENTAL') return '대여 완료'

  return '거래 완료'
}

// 요청자 관점의 행동을 표시하므로 판매 상품의 요청은 '구매'로 표현한다.
export const REQUEST_ACTION_LABEL: Record<TradeType, string> = {
  SALE: '구매',
  GIVEAWAY: '나눔',
  RENTAL: '대여',
}

export function getRequestActionLabel(tradeType: TradeType) {
  return `${REQUEST_ACTION_LABEL[tradeType]} 요청하기`
}

export function formatProductPrice({
  tradeType,
  price,
}: Pick<ProductSummary, 'tradeType' | 'price'>) {
  if (tradeType === 'GIVEAWAY') return '무료 나눔'

  if (price === null) return tradeType === 'RENTAL' ? '대여 문의' : '가격 협의'

  return `${price.toLocaleString('ko-KR')}원`
}
