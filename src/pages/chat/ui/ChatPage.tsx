import { MASCOTS } from '../../../shared/config/mascots'
import { isStandalone } from '../../../shared/lib/pwa'
import { Header } from '../../../widgets/header'

// 하단 탭의 채팅 자리. 채팅 화면을 만들기 전까지 준비 중임을 알린다.
export function ChatPage() {
  return (
    // 안내를 헤더와 하단 탭 사이 한가운데에 두려고 페이지 높이를 화면에 맞춘다.
    // 설치한 앱에서는 AppLayout이 하단 탭만큼 아래 여백을 따로 두므로 그만큼 뺀다
    <div
      className={`flex flex-col ${
        isStandalone() ? 'min-h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))]' : 'min-h-dvh'
      }`}
    >
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
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
