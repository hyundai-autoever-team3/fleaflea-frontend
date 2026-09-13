// Backend table: items (플리마켓에 등록된 상품). Named `product` on the frontend to avoid
// clashing with entities/collection-item (backend: collection_items, 개인 도감).
// trade_type 값은 ERD에 확정 표기됨 (판매=SALE, 나눔=GIVEAWAY, 대여=RENTAL). 교환(exchange)은
// trade_type 값이 아니라 trade_requests.swap_item_id로 요청 시점에 표현됨.
export type TradeType = 'SALE' | 'GIVEAWAY' | 'RENTAL'
export type ProductStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'

export interface Product {
  itemId: number
  marketId: number
  sellerId: number
  title: string
  description: string | null
  tradeType: TradeType
  // NOTE: ERD types this VARCHAR(20), not numeric — likely to allow non-numeric values
  // (e.g. 나눔 items with no price). Keep as string on the frontend to match.
  price: string | null
  status: ProductStatus
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}
