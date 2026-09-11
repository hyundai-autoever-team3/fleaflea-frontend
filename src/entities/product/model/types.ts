// Backend table: items (플리마켓에 등록된 상품). Named `product` on the frontend to avoid
// clashing with entities/collection-item (backend: collection_items, 개인 도감).
// TODO: confirm exact trade_type enum strings with backend — ERD only lists 판매/나눔/대여
// in the column comment, no fixed constants. 교환(exchange) isn't a trade_type value; it's
// expressed at request time via trade_requests.swap_item_id.
export type TradeType = 'SALE' | 'SHARE' | 'RENTAL'
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
