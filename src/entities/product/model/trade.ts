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

export function formatProductPrice({ tradeType, price }: Pick<ProductSummary, 'tradeType' | 'price'>) {
  if (tradeType === 'GIVEAWAY') return '무료 나눔'
  if (price === null) return '가격 협의'
  return `${price.toLocaleString('ko-KR')}원`
}
