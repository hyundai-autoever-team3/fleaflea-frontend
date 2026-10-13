import { queryClient } from '../../../shared/api/query-client'
import { updateRoom } from './cache'
import { publishChat } from './socket'
import { useChatStore } from './store'

// 이 시간 안에 저장됐다는 답이 없으면 실패로 보고 다시 보낼 수 있게 한다
const SEND_TIMEOUT = 10_000

function publishMessage(roomId: number, content: string, clientMessageId: string) {
  const { setPendingStatus } = useChatStore.getState()

  const sent = publishChat(`/app/chat/rooms/${roomId}/messages`, { content, clientMessageId })
  if (!sent) {
    setPendingStatus(clientMessageId, 'failed')
    return
  }

  // 답이 오면 목록에서 빠지므로, 그때까지 남아 있는 메시지만 실패로 바꾼다
  window.setTimeout(() => {
    const stillSending = useChatStore
      .getState()
      .pending.some((item) => item.clientMessageId === clientMessageId && item.status === 'sending')

    if (stillSending) setPendingStatus(clientMessageId, 'failed')
  }, SEND_TIMEOUT)
}

// 서버 답을 기다리지 않고 화면에 먼저 그린 뒤 보낸다.
// UUID는 여기서 한 번만 만든다. 서버가 이 값으로 같은 메시지의 중복 저장을 막는다
export function sendChatMessage(roomId: number, content: string) {
  const clientMessageId = crypto.randomUUID()

  useChatStore.getState().addPending({
    clientMessageId,
    roomId,
    content,
    createdAt: Date.now(),
    status: 'sending',
  })
  publishMessage(roomId, content, clientMessageId)
}

// 다시 보낼 때는 같은 UUID를 쓴다. 처음 것이 사실은 저장돼 있었다면 서버가 그 결과를 돌려준다
export function retryChatMessage(clientMessageId: string) {
  const { pending, setPendingStatus } = useChatStore.getState()
  const message = pending.find((item) => item.clientMessageId === clientMessageId)
  if (!message) return

  setPendingStatus(clientMessageId, 'sending')
  publishMessage(message.roomId, message.content, clientMessageId)
}

export function discardChatMessage(clientMessageId: string) {
  useChatStore.getState().removePending(clientMessageId)
}

// 실제로 화면에서 확인한 마지막 메시지 id를 보낸다. 보냈으면 안 읽은 수를 바로 지운다
export function markChatRoomRead(roomId: number, messageId: number) {
  const sent = publishChat(`/app/chat/rooms/${roomId}/read`, { messageId })
  if (!sent) return false

  updateRoom(queryClient, roomId, (room) => ({
    ...room,
    myLastReadId: Math.max(room.myLastReadId, messageId),
    unreadCount: 0,
  }))

  return true
}

// 입력 상태는 저장되지 않고 답도 오지 않는다. 연결이 없으면 그냥 보내지 않는다
export function sendChatTyping(roomId: number, typing: boolean) {
  publishChat(`/app/chat/rooms/${roomId}/typing`, { typing })
}
