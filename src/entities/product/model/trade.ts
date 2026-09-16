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

// '대여중'은 이미 빌려준 상태로 읽혀서 거래 가능일 때는 '대여 가능'으로 표시
const AVAILABLE_LABEL: Record<TradeType, string> = {
  SALE: '판매중',
  GIVEAWAY: '나눔중',
  RENTAL: '대여 가능',
}

export function getStatusTagLabel(status: ProductStatus, tradeType: TradeType) {
  if (status === 'AVAILABLE') return AVAILABLE_LABEL[tradeType]
  if (status === 'IN_PROGRESS') return '예약중'
  return '거래 완료'
}

// 거래 방식에 따라 버튼 문구를 바꿈
export function getRequestActionLabel(tradeType: TradeType) {
  return `${TRADE_TYPE_LABEL[tradeType]} 요청하기`
}

export function formatProductPrice({ tradeType, price }: Pick<ProductSummary, 'tradeType' | 'price'>) {
  if (tradeType === 'GIVEAWAY') return '무료 나눔'
  // 대여는 MVP에서 가격을 받지 않음
  if (price === null) return tradeType === 'RENTAL' ? '대여 문의' : '가격 협의'
  return `${price.toLocaleString('ko-KR')}원`
}
