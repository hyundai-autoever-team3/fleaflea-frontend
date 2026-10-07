// 마켓 상품(items)은 개인 도감(collection_items)과 구분해 Product로 이름 붙인다.
// 교환은 상품의 거래 종류가 아니라 요청의 swapItemId로 표현한다.
export type TradeType = 'SALE' | 'GIVEAWAY' | 'RENTAL'
export type ProductStatus = 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'

// GET/POST /api/v1/markets/{marketId}/items 응답 (ItemSummaryResponse).
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
// 상세 응답은 imageKey만 제공하므로 사진 주소는 목록의 imageUrl을 사용한다.
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
