// Swagger FriendshipResponse — 친구 목록(GET /api/v1/members/me/friendship)과
// 친구 요청 목록(GET /api/v1/friend-requests)이 같은 형태를 씀.
// 요청 → 수락 모델이라 맞팔로우가 아니며, 상태는 로그인한 사용자 기준으로 내려옴
export type RelationshipStatus =
  | 'NONE' // 아무 관계 없음 (검색 결과에만 나옴)
  | 'REQUESTED' // 내가 상대에게 요청을 보낸 상태
  | 'REQUEST_RECEIVED' // 상대가 나에게 요청을 보낸 상태
  | 'FRIEND' // 서로 친구

export interface Friendship {
  friendshipId: number
  memberId: number
  nickname: string
  profileImageUrl: string | null
  relationshipStatus: RelationshipStatus
}

// GET /api/v1/friend-requests 의 direction 쿼리 값
export type FriendRequestDirection = 'SENT' | 'RECEIVED'

// GET /api/v1/members?nickname= 응답 (아직 백엔드에 없는 API — 합의한 형태로 미리 맞춰 둠).
// 아직 관계가 없는 사람도 나오므로 friendshipId가 없고 relationshipStatus에 NONE이 올 수 있음
export interface MemberSearchResult {
  memberId: number
  nickname: string
  profileImageUrl: string | null
  relationshipStatus: RelationshipStatus
}
