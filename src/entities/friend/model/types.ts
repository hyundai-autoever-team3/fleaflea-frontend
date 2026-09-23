// Swagger FriendshipResponse — 친구 목록(GET /api/v1/members/me/friendship)과
// 친구 요청 목록(GET /api/v1/friend-requests)이 같은 형태를 씀.
// 요청 → 수락 모델이라 맞팔로우가 아니며, 상태는 로그인한 사용자 기준으로 내려옴.
// 마켓 참여자 응답도 같은 값을 쓰므로 정의는 shared에 둔다
import type { RelationshipStatus } from '../../../shared/api/relationship-status'

export type { RelationshipStatus }

export interface Friendship {
  friendshipId: number
  memberId: number
  nickname: string
  profileImageUrl: string | null
  relationshipStatus: RelationshipStatus
}

// GET /api/v1/friend-requests 의 direction 쿼리 값
export type FriendRequestDirection = 'SENT' | 'RECEIVED'

// GET /api/v1/members/search?nickname= 응답 (Swagger SearchMemberResponse).
// 프로필 이미지와 친구 관계는 이 응답에 포함되지 않음.
export interface MemberSearchResult {
  memberId: number
  nickname: string
}
