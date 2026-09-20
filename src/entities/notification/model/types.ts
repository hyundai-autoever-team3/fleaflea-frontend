// Swagger NotificationResponse와 같은 형태를 유지한다.
// message는 백엔드가 알림 발생 상황에 맞춰 만들어 주는 최종 사용자 문구다.
export type NotificationType =
  | 'TRADE_REQUESTED'
  | 'TRADE_ACCEPTED'
  | 'TRADE_REJECTED'
  | 'TRADE_CANCELLED'
  | 'TRADE_COMPLETED'
  | 'FRIEND_REQUESTED'
  | 'FRIEND_ACCEPTED'
  | 'POKE_RECEIVED'

export type NotificationReferenceType =
  | 'ITEM_TRADE_REQUEST'
  | 'COLLECTION_TRADE_REQUEST'
  | 'BEG_REQUEST'
  | 'FRIENDSHIP'
  | 'MEMBER_POKE'

export interface NotificationItem {
  notificationId: number
  type: NotificationType
  referenceType: NotificationReferenceType
  referenceId: number
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationUnreadCount {
  unreadCount: number
}
