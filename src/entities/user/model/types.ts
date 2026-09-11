// Backend table: users (member_id PK). Password intentionally omitted from the frontend type.
export interface User {
  memberId: number
  email: string
  nickname: string
  profileImageUrl: string | null
  createdAt: string
  updatedAt: string
}
