import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { ChatMessagePage, ChatRoom, ChatRoomList } from '../model/types'

export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  room: (roomId: number) => [...chatKeys.all, 'room', roomId] as const,
  messages: (roomId: number) => [...chatKeys.all, 'messages', roomId] as const,
}

const ROOM_PAGE_SIZE = 100
const MESSAGE_PAGE_SIZE = 30

// 요청 값·인증·권한·대상 오류는 자동 재시도로 해결되지 않는다.
function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 400 || status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

// 친구와의 방이 없으면 만들고, 있으면 그 방을 돌려준다
export function openChatRoom(friendId: number) {
  return api.post<ChatRoom>('/api/v1/chat/rooms', { friendId })
}

export function getChatRooms() {
  return api.get<ChatRoomList>('/api/v1/chat/rooms', {
    params: { page: 0, size: ROOM_PAGE_SIZE },
  })
}

// 방은 친구 한 명당 하나라 한 번에 받을 수 있는 최대(100개)까지만 조회한다
export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: async () => (await getChatRooms()).data.rooms,
    retry: retryUnlessClientError,
  })
}

export function getChatRoom(roomId: number) {
  return api.get<ChatRoom>(`/api/v1/chat/rooms/${roomId}`)
}

export function useChatRoom(roomId: number) {
  return useQuery({
    queryKey: chatKeys.room(roomId),
    queryFn: async () => (await getChatRoom(roomId)).data,
    retry: retryUnlessClientError,
  })
}

// beforeId가 없으면 최신 메시지부터, 있으면 그보다 이전 메시지를 최신순으로 받는다
export function getChatMessages(roomId: number, beforeId?: number) {
  return api.get<ChatMessagePage>(`/api/v1/chat/rooms/${roomId}/messages`, {
    params: { beforeId, size: MESSAGE_PAGE_SIZE },
  })
}

// 첫 묶음이 최신 메시지이고, 다음 묶음으로 갈수록 과거 메시지다
export function useChatMessages(roomId: number) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: async ({ pageParam }) => (await getChatMessages(roomId, pageParam)).data,
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext && lastPage.nextCursor !== null ? lastPage.nextCursor : undefined,
    retry: retryUnlessClientError,
  })
}
