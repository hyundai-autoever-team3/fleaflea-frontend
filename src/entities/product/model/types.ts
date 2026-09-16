// Backend table: items (플리마켓에 등록된 상품). Named `product` on the frontend to avoid
// clashing with entities/collection-item (backend: collection_items, 개인 도감).
// trade_type 값은 ERD에 확정 표기됨 (판매=SALE, 나눔=GIVEAWAY, 대여=RENTAL). 교환(exchange)은
// trade_type 값이 아니라 trade_requests.swap_item_id로 요청 시점에 표현됨.
export type TradeType = 'SALE' | 'GIVEAWAY' | 'RENTAL'
export type ProductStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'

// GET/POST /api/v1/markets/{marketId}/items 응답 (Swagger ItemSummaryResponse). API에서 price는 숫자
export interface ProductSummary {
  itemId: number
  title: string
  tradeType: TradeType
  price: number | null
  status: ProductStatus
  imageUrl: string | null
  createdAt: string
}

// GET /api/v1/items/{itemId} 응답의 seller (Swagger SellerResponse)
export interface ProductSeller {
  id: number
  nickname: string
  profileImageUrl: string | null
}

// GET /api/v1/items/{itemId} 응답 (Swagger ItemDetailResponse).
// 목록과 달리 사진 주소 대신 저장 키(imageKey)만 내려줌 — 사진은 목록의 imageUrl을 사용
export interface ProductDetail {
  itemId: number
  marketId: number
  seller: ProductSeller
  title: string
  description: string | null
  tradeType: TradeType
  price: number | null
  status: ProductStatus
  imageKey: string | null
  createdAt: string
}
