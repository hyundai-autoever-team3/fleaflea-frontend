import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router'

import { chatKeys, openChatRoom } from '../../../entities/chat'
import { useToastStore } from '../../../shared/ui/toast'

// 친구와의 채팅방을 열고(없으면 만들고) 그 방으로 이동한다
export function useOpenChatRoom() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (friendId: number) => (await openChatRoom(friendId)).data,
    onSuccess: (room) => {
      queryClient.setQueryData(chatKeys.room(room.id), room)
      void navigate(`/chat/${room.id}`, { viewTransition: true })
    },
    onError: (error) => {
      const code = isAxiosError<{ code?: string }>(error) ? error.response?.data?.code : undefined

      useToastStore
        .getState()
        .showToast(
          code === 'CHAT_FRIEND_REQUIRED'
            ? '친구와만 채팅할 수 있어요.'
            : '채팅방을 열지 못했어요. 잠시 후 다시 시도해 주세요.',
        )
    },
  })
}
