// Backend table: trade_requests
export type TradeRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export interface TradeRequest {
  tradeRequestId: number
  itemId: number
  requesterId: number
  rentalStartDate: string | null
  rentalEndDate: string | null
  // Set when the request is for an exchange (교환) against one of the requester's own items.
  swapItemId: number | null
  status: TradeRequestStatus
  createdAt: string
  updatedAt: string
}

// Backend table: trades — created once a trade_request is accepted and actually completed.
// Distinguishing sale/giveaway/rental/exchange for a Trade still requires the related
// Product.tradeType (via itemId) and TradeRequest.swapItemId (via tradeRequestId); neither
// is duplicated onto this table.
export interface Trade {
  tradeId: number
  tradeRequestId: number
  itemId: number
  buyerId: number
  sellerId: number
  completedAt: string | null
  createdAt: string
}
