// Backend table: beg_requests (구걸 요청). Separate from trade_requests — targets a
// collection_item directly (the owner's public 도감 item), not a market listing.
export type BegRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface BegRequest {
  begId: number
  collectionItemId: number
  applicantId: number
  // 물건을 요청하기 위해 작성한 사연 (message the applicant writes to ask for the item)
  story: string | null
  status: BegRequestStatus
  createdAt: string
  updatedAt: string
}
