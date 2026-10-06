import type { RelationshipStatus } from '../../../shared/api/relationship-status'

export type { RelationshipStatus }

// 친구 목록과 친구 요청 목록은 같은 응답을 사용하며, 관계 상태는 로그인한 사용자 기준이다.
export interface Friendship {
  friendshipId: number
  memberId: number
  nickname: string
  profileImageUrl: string | null
  relationshipStatus: RelationshipStatus
}

// GET /api/v1/friend-requests 의 direction 쿼리 값
export type FriendRequestDirection = 'SENT' | 'RECEIVED'

// 닉네임 검색 응답에는 프로필 이미지와 친구 관계가 포함되지 않는다.
export interface MemberSearchResult {
  memberId: number
  nickname: string
}
