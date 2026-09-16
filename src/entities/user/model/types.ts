// Backend table: users (member_id PK). Password intentionally omitted from the frontend type.
export interface User {
  memberId: number
  email: string
  nickname: string
  profileImageUrl: null
  createdAt: string
  updatedAt: string
}
