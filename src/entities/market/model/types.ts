// 백엔드 Swagger(https://api.fleaflea.app/v3/api-docs) 응답 형식 기준
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
// relationshipStatus는 로그인한 사용자와 그 참여자 사이의 친구 관계다.
// 참여자 목록만으로 친구 요청 버튼을 무엇으로 보여줄지 정할 수 있다
export interface MarketMember {
  memberId: number
  nickname: string
  profileImageUrl: string | null
  host: boolean
  relationshipStatus: RelationshipStatus
  joinedAt: string
}
