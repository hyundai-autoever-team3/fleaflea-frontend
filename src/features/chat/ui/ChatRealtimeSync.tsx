import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { chatKeys, type ChatSocketError, type ChatSocketEvent } from '../../../entities/chat'
import { useSessionStore } from '../../../entities/session'
import { useToastStore } from '../../../shared/ui/toast'
import { applyRead, findRoom, receiveMessage } from '../model/cache'
import { connectChatSocket, disconnectChatSocket } from '../model/socket'
import { useChatStore } from '../model/store'

// 상대가 계속 입력하면 1초마다 갱신이 온다. 3초 동안 소식이 없으면 표시를 내린다
const TYPING_HIDE_DELAY = 3_000

const ERROR_MESSAGE: Record<string, string> = {
  CHAT_FRIEND_REQUIRED: '지금은 친구가 아니라서 메시지를 보낼 수 없어요.',
  CHAT_RATE_LIMIT_EXCEEDED: '메시지를 너무 빠르게 보냈어요. 잠시 후 다시 보내 주세요.',
  INVALID_REQUEST: '보낼 수 없는 메시지예요. 내용을 확인해 주세요.',
}

// 채팅 화면이 떠 있는 동안 웹소켓을 연결해 두고, 받은 내용을 조회 캐시에 반영한다.
// 화면은 캐시만 보고 그리므로 REST로 받은 것과 실시간으로 받은 것이 같은 자리에 모인다
export function ChatRealtimeSync() {
  const queryClient = useQueryClient()
  // 토큰이 새로 발급될 때마다 다시 연결하지 않도록 로그인 여부만 본다
  const loggedIn = useSessionStore((state) => state.accessToken !== null)

  useEffect(() => {
    if (!loggedIn) return

    const typingTimers = new Map<number, number>()

    function setTyping(roomId: number, typing: boolean) {
      window.clearTimeout(typingTimers.get(roomId))
      typingTimers.delete(roomId)
      useChatStore.getState().setTyping(roomId, typing)

      if (typing)
        typingTimers.set(
          roomId,
          window.setTimeout(() => setTyping(roomId, false), TYPING_HIDE_DELAY),
        )
    }

    // 지금 그 방을 열어 두고 창도 보고 있을 때만 읽은 것으로 친다
    function isReading(roomId: number) {
      return useChatStore.getState().activeRoomId === roomId && !document.hidden
    }

    function handleEvent(event: ChatSocketEvent) {
      if (event.type === 'chat-message') {
        const message = event.payload
        const reading = isReading(message.roomId)
        const fromFriend = findRoom(queryClient, message.roomId)?.friendId === message.senderId

        if (message.clientMessageId) useChatStore.getState().removePending(message.clientMessageId)
        receiveMessage(queryClient, message, reading)

        // 메시지가 왔으면 입력은 끝난 것이다. 읽음 처리는 그 방 화면이 맡는다
        if (fromFriend) setTyping(message.roomId, false)
        return
      }

      if (event.type === 'chat-read') {
        applyRead(queryClient, event.payload)
        return
      }

      // 입력 중 표시는 상대가 보낸 것만 온다
      setTyping(event.payload.roomId, event.payload.typing)
    }

    function handleError(error: ChatSocketError) {
      // 오류 응답에는 어느 메시지인지가 없다. 가장 먼저 보낸 대기 메시지를 실패로 본다
      const { pending, setPendingStatus } = useChatStore.getState()
      const waiting = pending.find((message) => message.status === 'sending')

      if (waiting) setPendingStatus(waiting.clientMessageId, 'failed')
      // 친구가 끊긴 경우 입력창을 막아야 하므로 방 정보를 다시 받는다
      if (error.code === 'CHAT_FRIEND_REQUIRED')
        void queryClient.invalidateQueries({ queryKey: chatKeys.all })

      useToastStore
        .getState()
        .showToast(ERROR_MESSAGE[error.code] ?? '메시지를 처리하지 못했어요. 다시 시도해 주세요.')
    }

    connectChatSocket({
      onEvent: handleEvent,
      onResult: (result) => {
        // 메시지 전송의 결과는 저장된 메시지, 읽음 처리의 결과는 읽음 상태다
        if ('content' in result) {
          if (result.clientMessageId) useChatStore.getState().removePending(result.clientMessageId)
          receiveMessage(queryClient, result, isReading(result.roomId))
          return
        }

        applyRead(queryClient, result)
      },
      onError: handleError,
      // 연결이 끊긴 동안의 메시지는 실시간으로 다시 오지 않는다. 방 목록과 대화를 REST로 다시 받는다
      onConnected: () => void queryClient.invalidateQueries({ queryKey: chatKeys.all }),
    })

    return () => {
      typingTimers.forEach((timer) => window.clearTimeout(timer))
      disconnectChatSocket()
    }
  }, [loggedIn, queryClient])

  return null
}
