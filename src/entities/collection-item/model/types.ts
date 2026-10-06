// CollectionItemSummaryResponse: 목록에는 설명과 소유자 정보가 포함되지 않는다.
export interface CollectionItemSummary {
  collectionItemId: number
  title: string
  imageUrl: string | null
  isPublic: boolean
  createdAt: string
}

// 상세에만 포함되는 상태로, 진행 중인 물건에는 새 요청을 보낼 수 없다.
export type CollectionItemStatus = 'AVAILABLE' | 'IN_PROGRESS'

// CollectionItemResponse: GET /collection-items/{collectionItemId}
export interface CollectionItemDetail extends CollectionItemSummary {
  ownerId: number
  ownerNickname: string
  description: string | null
  updatedAt: string
  status: CollectionItemStatus
}

export type CollectionItem = CollectionItemDetail
