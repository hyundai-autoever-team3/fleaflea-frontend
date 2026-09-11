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
