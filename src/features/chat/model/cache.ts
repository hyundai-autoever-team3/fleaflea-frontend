import type { InfiniteData, QueryClient } from '@tanstack/react-query'

import {
  chatKeys,
  type ChatMessage,
  type ChatMessagePage,
  type ChatRead,
  type ChatRoom,
} from '../../../entities/chat'

type MessagePages = InfiniteData<ChatMessagePage, number | undefined>

export function findRoom(queryClient: QueryClient, roomId: number) {
  return (
    queryClient.getQueryData<ChatRoom>(chatKeys.room(roomId)) ??
    queryClient.getQueryData<ChatRoom[]>(chatKeys.rooms())?.find((room) => room.id === roomId)
  )
}

// 방 정보는 목록과 상세 두 곳에 캐시돼 있어 함께 고친다.
// toTop이면 목록에서 맨 위로 올린다(최근 활동순)
export function updateRoom(
  queryClient: QueryClient,
  roomId: number,
  update: (room: ChatRoom) => ChatRoom,
  toTop = false,
) {
  queryClient.setQueryData<ChatRoom>(chatKeys.room(roomId), (room) => room && update(room))
  queryClient.setQueryData<ChatRoom[]>(chatKeys.rooms(), (rooms) => {
    if (!rooms) return rooms

    const target = rooms.find((room) => room.id === roomId)
    if (!target) return rooms

    const updated = update(target)
    if (toTop) return [updated, ...rooms.filter((room) => room.id !== roomId)]

    return rooms.map((room) => (room.id === roomId ? updated : room))
  })
}

// 열어 본 방이면 메시지 목록 맨 앞(최신 쪽)에 넣는다. 같은 메시지가 실시간 이벤트와
// 요청 결과로 두 번 올 수 있어 id로 걸러 내고, 도착 순서가 바뀔 수 있어 id 순으로 다시 세운다
function insertMessage(queryClient: QueryClient, message: ChatMessage) {
  queryClient.setQueryData<MessagePages>(chatKeys.messages(message.roomId), (current) => {
    if (!current || current.pages.length === 0) return current
    if (current.pages.some((page) => page.content.some((item) => item.id === message.id)))
      return current

    const [first, ...rest] = current.pages
    const content = [message, ...first.content].sort((a, b) => b.id - a.id)

    return { ...current, pages: [{ ...first, content }, ...rest] }
  })
}

// reading: 사용자가 지금 이 방을 보고 있는지. 보고 있으면 안 읽은 수를 올리지 않는다
export function receiveMessage(queryClient: QueryClient, message: ChatMessage, reading: boolean) {
  insertMessage(queryClient, message)

  const room = findRoom(queryClient, message.roomId)

  // 처음 대화가 시작된 방이라 목록에 아직 없으면 목록을 다시 받는다
  if (!queryClient.getQueryData<ChatRoom[]>(chatKeys.rooms())?.some((r) => r.id === message.roomId))
    void queryClient.invalidateQueries({ queryKey: chatKeys.rooms() })

  if (!room) return

  // 이미 반영한 메시지(중복 수신)는 방 정보를 다시 건드리지 않는다
  if (room.lastMessageId !== null && message.id <= room.lastMessageId) return

  const fromFriend = message.senderId === room.friendId

  updateRoom(
    queryClient,
    message.roomId,
    (current) => ({
      ...current,
      lastMessageId: message.id,
      lastMessageContent: message.content,
      lastMessageAt: message.createdAt,
      unreadCount: fromFriend && !reading ? current.unreadCount + 1 : current.unreadCount,
    }),
    true,
  )
}

// 읽음 위치는 뒤로 가지 않는다. 상대가 읽었으면 "읽음" 표시가, 내가(다른 기기에서) 읽었으면 안 읽은 수가 바뀐다
export function applyRead(queryClient: QueryClient, read: ChatRead) {
  const room = findRoom(queryClient, read.roomId)
  if (!room) return

  if (read.memberId === room.friendId) {
    updateRoom(queryClient, read.roomId, (current) => ({
      ...current,
      friendLastReadId: Math.max(current.friendLastReadId, read.lastReadMessageId),
    }))
    return
  }

  updateRoom(queryClient, read.roomId, (current) => ({
    ...current,
    myLastReadId: Math.max(current.myLastReadId, read.lastReadMessageId),
    unreadCount:
      current.lastMessageId !== null && read.lastReadMessageId >= current.lastMessageId
        ? 0
        : current.unreadCount,
  }))
}
