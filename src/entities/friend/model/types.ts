// Backend table: friendships. Request/accept model (not mutual-follow) — one row per
// friend request, status flips to ACCEPTED when the addressee accepts.
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface Friendship {
  friendshipId: number
  requesterId: number
  addresseeId: number
  status: FriendshipStatus
  createdAt: string
  updatedAt: string
}
