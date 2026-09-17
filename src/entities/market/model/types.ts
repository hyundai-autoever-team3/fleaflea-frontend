// 백엔드 Swagger(/v3/api-docs) 응답 형식 기준
export type { PageResponse } from '../../../shared/api/page-response'

// 여러 응답이 공통으로 쓰는 회원 요약 (Swagger MemberSummaryResponse).
// 예전에는 hostId·hostNickname이 평평하게 내려왔는데 host 객체로 묶여 바뀜
export interface MemberSummary {
  memberId: number
  nickname: string
  profileImageUrl: string | null
}

// GET /api/v1/markets/{marketId}/invitation (호스트만 조회 가능)
export interface MarketInvitation {
  marketId: number
  inviteCode: string
}

// GET /api/v1/markets
export interface MarketSummary {
  marketId: number
  host: MemberSummary
  title: string
  description: string | null
  coverImageUrl: string | null
  joinedAt: string
}

// GET /api/v1/markets/{marketId}
export interface MarketDetail {
  marketId: number
  host: MemberSummary
  title: string
  description: string | null
  coverImageUrl: string | null
  memberCount: number
  createdAt: string
}

// GET /api/v1/markets/{marketId}/members
export interface MarketMember {
  memberId: number
  nickname: string
  profileImageUrl: string | null
  host: boolean
  joinedAt: string
}
