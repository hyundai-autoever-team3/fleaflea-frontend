import type { RelationshipStatus } from '../../../shared/api/relationship-status'

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
// relationshipStatus는 로그인한 사용자와 해당 참여자의 친구 관계다.
export interface MarketMember {
  memberId: number
  nickname: string
  profileImageUrl: string | null
  host: boolean
  relationshipStatus: RelationshipStatus
  joinedAt: string
}
