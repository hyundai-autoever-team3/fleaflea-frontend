import { MASCOTS } from '../../../shared/config/mascots'
import { Header } from '../../../widgets/header'

// 하단 탭의 채팅 자리. 채팅 화면을 만들기 전까지 준비 중임을 알린다.
export function ChatPage() {
  return (
    <div>
      <Header />
      <main className="flex flex-col items-center px-6 py-24 text-center">
        <img
          draggable={false}
          src={MASCOTS.basket}
          alt=""
          className="h-24 object-contain [image-rendering:pixelated]"
        />
        <h1 className="mt-6 text-body-02 font-bold text-text-strong">채팅은 아직 준비 중이에요</h1>
        <p className="mt-2 text-body-04 text-text-muted">
          그동안은 거래 요청과 알림으로 소식을 주고받을 수 있어요.
        </p>
      </main>
    </div>
  )
}
