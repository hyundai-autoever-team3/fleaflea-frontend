// 구걸 요청은 마켓 상품이 아닌 공개된 도감 물건을 대상으로 한다.
export type BegRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface BegRequest {
  begId: number
  collectionItemId: number
  applicantId: number
  // 요청자가 물건을 받기 위해 작성한 사연.
  story: string | null
  status: BegRequestStatus
  createdAt: string
  updatedAt: string
}
