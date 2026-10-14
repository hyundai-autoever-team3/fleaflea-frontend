import { create } from 'zustand'

export type ChatSocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting'

// 보냈지만 서버가 저장했다는 답을 아직 받지 못한 메시지. 화면에는 먼저 그려 둔다
export interface PendingMessage {
  clientMessageId: string
  roomId: number
  content: string
  createdAt: number
  status: 'sending' | 'failed'
}

interface ChatState {
  status: ChatSocketStatus
  // 지금 화면에 열려 있는 방. 새 메시지를 안 읽은 수에 더할지, 바로 읽음 처리할지 가른다
  activeRoomId: number | null
  pending: PendingMessage[]
  // 상대가 입력 중인 방
  typingRoomIds: number[]
  setStatus: (status: ChatSocketStatus) => void
  setActiveRoomId: (roomId: number | null) => void
  addPending: (message: PendingMessage) => void
  setPendingStatus: (clientMessageId: string, status: PendingMessage['status']) => void
  removePending: (clientMessageId: string) => void
  setTyping: (roomId: number, typing: boolean) => void
  reset: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  status: 'idle',
  activeRoomId: null,
  pending: [],
  typingRoomIds: [],
  setStatus: (status) => set({ status }),
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  addPending: (message) => set((state) => ({ pending: [...state.pending, message] })),
  setPendingStatus: (clientMessageId, status) =>
    set((state) => ({
      pending: state.pending.map((message) =>
        message.clientMessageId === clientMessageId ? { ...message, status } : message,
      ),
    })),
  removePending: (clientMessageId) =>
    set((state) => ({
      pending: state.pending.filter((message) => message.clientMessageId !== clientMessageId),
    })),
  setTyping: (roomId, typing) =>
    set((state) => {
      const others = state.typingRoomIds.filter((id) => id !== roomId)

      return { typingRoomIds: typing ? [...others, roomId] : others }
    }),
  reset: () => set({ status: 'idle', activeRoomId: null, pending: [], typingRoomIds: [] }),
}))
