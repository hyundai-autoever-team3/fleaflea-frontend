// 백엔드가 친구 목록·친구 요청·마켓 참여자 응답에 같은 모양으로 실어 보내는 값이라
// 한 엔티티에 두지 않고 공통 자리에 둔다. 값은 늘 로그인한 사용자 기준이다
export type RelationshipStatus =
  | 'SELF' // 나 자신
  | 'NONE' // 아무 관계 없음
  | 'REQUESTED' // 내가 상대에게 요청을 보낸 상태
  | 'REQUEST_RECEIVED' // 상대가 나에게 요청을 보낸 상태
  | 'FRIEND' // 서로 친구
