// Backend table: collection_items (개인 물건 도감). Separate from entities/product
// (backend: items, 마켓에 등록된 상품) — a collection item may or may not be listed
// to a market as a product.
export interface CollectionItem {
  collectionItemId: number
  memberId: number
  title: string
  description: string | null
  imageUrl: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
