// 백엔드 Swagger(/v3/api-docs) 응답 형식 기준
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

// GET /markets
export interface MarketSummary {
  marketId: number
  hostId: number
  hostNickname: string
  title: string
  description: string | null
  coverImageUrl: string | null
  joinedAt: string
}

// GET /markets/{marketId}
export interface MarketDetail {
  marketId: number
  hostId: number
  hostNickname: string
  title: string
  description: string | null
  coverImageUrl: string | null
  memberCount: number
  createdAt: string
}

// GET /markets/{marketId}/members
export interface MarketMember {
  memberId: number
  nickname: string
  profileImageUrl: string | null
  host: boolean
  joinedAt: string
}
