// CollectionItemSummaryResponse: 목록에는 설명과 소유자 정보가 포함되지 않는다.
export interface CollectionItemSummary {
  collectionItemId: number
  title: string
  imageUrl: string | null
  isPublic: boolean
  createdAt: string
}

// CollectionItemResponse: GET /collection-items/{collectionItemId}
export interface CollectionItemDetail extends CollectionItemSummary {
  ownerId: number
  ownerNickname: string
  description: string | null
  updatedAt: string
}

export type CollectionItem = CollectionItemDetail
