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
  // 사고파는 물건은 아직 넘어가기 전이라 '예약중'이지만,
  // 대여는 수락된 그 순간부터 빌려준 상태라 '대여 중'이 실제와 맞다.
  // 띄어쓰기는 같은 대여의 앞 단계인 '대여 가능', 그리고 거래 목록의 '대여 중'에 맞춘다
  if (status === 'IN_PROGRESS') return tradeType === 'RENTAL' ? '대여 중' : '예약중'
  // 대여가 끝난 상품은 다시 빌려줄 수 있어야 하므로 여기까지 오지 않는 것이 맞다.
  // 그 처리가 들어가기 전에 끝난 대여가 COMPLETED로 남아 있어, 적어도 제 이름으로는 부른다
  if (tradeType === 'RENTAL') return '대여 완료'
  return '거래 완료'
}

// 요청을 보내는 쪽에서 본 이름. 파는 사람이 '판매'하는 물건을 사려는 것이므로
// 버튼에는 '구매'라고 적어야 누르는 사람의 행동과 맞는다
export const REQUEST_ACTION_LABEL: Record<TradeType, string> = {
  SALE: '구매',
  GIVEAWAY: '나눔',
  RENTAL: '대여',
}

// 거래 방식에 따라 버튼 문구를 바꿈
export function getRequestActionLabel(tradeType: TradeType) {
  return `${REQUEST_ACTION_LABEL[tradeType]} 요청하기`
}

export function formatProductPrice({ tradeType, price }: Pick<ProductSummary, 'tradeType' | 'price'>) {
  if (tradeType === 'GIVEAWAY') return '무료 나눔'
  // 대여는 MVP에서 가격을 받지 않음
  if (price === null) return tradeType === 'RENTAL' ? '대여 문의' : '가격 협의'
  return `${price.toLocaleString('ko-KR')}원`
}
