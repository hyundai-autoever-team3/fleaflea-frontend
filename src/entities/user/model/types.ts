// 비밀번호를 제외한 사용자 정보만 클라이언트에서 다룬다.
export interface User {
  memberId: number
  email: string
  nickname: string
  profileImageUrl: null
  createdAt: string
  updatedAt: string
}
