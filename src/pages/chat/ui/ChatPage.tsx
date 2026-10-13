import { useParams } from 'react-router'

import { ChatRealtimeSync } from '../../../features/chat'
import { MASCOTS } from '../../../shared/config/mascots'
import { isStandalone } from '../../../shared/lib/pwa'
import { ChatRoomView } from '../../../widgets/chat-room'
import { ChatRoomList } from '../../../widgets/chat-room-list'
import { Header } from '../../../widgets/header'

// /chat 은 목록, /chat/:roomId 는 대화방이다.
// 넓은 화면에서는 둘을 나란히 두고, 좁은 화면과 설치한 앱에서는 주소에 맞는 한쪽만 보여 준다
export function ChatPage() {
  const params = useParams()
  const parsed = Number(params.roomId)
  const roomId = Number.isInteger(parsed) && parsed > 0 ? parsed : null

  return (
    // 대화 영역만 스크롤되도록 페이지 높이를 화면에 맞춘다.
    // 설치한 앱에서는 AppLayout이 하단 탭만큼 아래 여백을 따로 두므로 그만큼 뺀다
    <div
      className={`flex flex-col md:bg-primary-subtle/30 ${
        isStandalone() ? 'h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))]' : 'h-dvh'
      }`}
    >
      <Header />
      <ChatRealtimeSync />

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 md:gap-4 md:px-6 md:pb-6 md:pt-2">
        <section
          aria-label="채팅 목록"
          className={`min-h-0 w-full flex-col overflow-hidden bg-bg md:glass-pane md:w-80 md:shrink-0 md:rounded-3xl ${
            roomId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <h1 className="px-4 pb-2 pt-4 text-body-02 font-bold text-text-strong">채팅</h1>
          <ChatRoomList activeRoomId={roomId} />
        </section>

        <section
          aria-label="대화"
          className={`min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg md:glass-pane md:rounded-3xl ${
            roomId ? 'flex' : 'hidden md:flex'
          }`}
        >
          {roomId ? (
            // 방이 바뀌면 입력하던 글과 스크롤 위치를 새로 시작한다
            <ChatRoomView key={roomId} roomId={roomId} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <img
                draggable={false}
                src={MASCOTS.wink}
                alt=""
                className="h-24 object-contain [image-rendering:pixelated]"
              />
              <p className="mt-5 text-body-02 font-bold text-text-strong">대화를 골라 주세요</p>
              <p className="mt-1 text-body-04 text-text-muted">
                왼쪽 목록에서 친구를 누르면 대화가 열려요.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
