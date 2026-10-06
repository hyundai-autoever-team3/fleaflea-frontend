export type TradeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export interface TradeRequest {
  tradeRequestId: number
  itemId: number
  requesterId: number
  rentalStartDate: string | null
  rentalEndDate: string | null
  // 교환 요청에서 요청자가 제시한 물건 ID.
  swapItemId: number | null
  status: TradeRequestStatus
  createdAt: string
  updatedAt: string
}

// 거래 종류는 관련 Product.tradeType과 TradeRequest.swapItemId에서 확인한다.
export interface Trade {
  tradeId: number
  tradeRequestId: number
  itemId: number
  buyerId: number
  sellerId: number
  completedAt: string | null
  createdAt: string
}
