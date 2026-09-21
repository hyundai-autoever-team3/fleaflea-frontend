// 백엔드 Swagger(https://api.fleaflea.app/v3/api-docs) 응답 형식 기준
export type { PageResponse } from '../../../shared/api/page-response'

// GET /markets/{marketId}/invitation (호스트만 조회 가능)
export interface MarketInvitation {
  marketId: number
  inviteCode: string
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
