// 채팅방 응답. 상대 정보와 읽음 위치는 로그인한 사용자 기준이다
export interface ChatRoom {
  id: number
  friendId: number
  nickname: string
  profileImageUrl: string | null
  // 친구를 끊었거나 상대가 탈퇴하면 false. 지난 대화는 볼 수 있고 새로 보낼 수만 없다
  canSend: boolean
  lastMessageId: number | null
  lastMessageContent: string | null
  lastMessageAt: string | null
  myLastReadId: number
  friendLastReadId: number
  unreadCount: number
}

export interface ChatRoomList {
  rooms: ChatRoom[]
  hasNext: boolean
}

export interface ChatMessage {
  id: number
  roomId: number
  senderId: number
  content: string
  // 보낼 때 프론트가 만든 UUID. 내가 보낸 메시지가 저장됐는지 짝지을 때 쓴다
  clientMessageId: string | null
  createdAt: string
}

// GET /rooms/{roomId}/messages 응답. nextCursor를 같은 방향의 커서로 다시 넘긴다
export interface ChatMessagePage {
  content: ChatMessage[]
  nextCursor: number | null
  hasNext: boolean
}

export interface ChatRead {
  roomId: number
  memberId: number
  lastReadMessageId: number
}

export interface ChatTyping {
  roomId: number
  memberId: number
  typing: boolean
}

// /user/queue/chat 으로 오는 실시간 이벤트
export type ChatSocketEvent =
  | { type: 'chat-message'; payload: ChatMessage }
  | { type: 'chat-read'; payload: ChatRead }
  | { type: 'chat-typing'; payload: ChatTyping }

// /user/queue/chat-acks 로 오는 요청 결과. 메시지 전송이면 저장된 메시지, 읽음 처리면 읽음 상태다
export type ChatSocketResult = ChatMessage | ChatRead

// /user/queue/chat-errors 로 오는 요청 오류
export interface ChatSocketError {
  code: string
  message: string
}
