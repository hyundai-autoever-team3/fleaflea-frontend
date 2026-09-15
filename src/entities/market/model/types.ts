// Backend tables: markets, market_members, market_invites
export type MarketStatus = 'SCHEDULED' | 'OPEN' | 'CLOSED'

export interface Market {
  marketId: number
  hostId: number
  title: string
  description: string | null
  imageUrl: string | null
  startDate: string
  endDate: string
  status: MarketStatus
  createdAt: string
  updatedAt: string
}

export interface MarketMember {
  marketMemberId: number
  marketId: number
  memberId: number
  joinedAt: string
}

export interface MarketInvite {
  inviteId: number
  marketId: number
  inviteCode: string
  createdAt: string
}
