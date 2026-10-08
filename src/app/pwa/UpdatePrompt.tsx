import { useRegisterSW } from 'virtual:pwa-register/react'

import { pixelBox } from '../../shared/lib/pixel'
import { isStandalone } from '../../shared/lib/pwa'

// 새 서비스 워커가 대기 중일 때 화면 아래에 안내를 띄운다.
// 사용자가 새로고침을 눌러야 교체해서, 쓰던 화면이 갑자기 바뀌지 않게 한다.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      // 설치한 앱에서는 하단 탭에 가려지지 않게 그 위로 올린다
      className={`fixed inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-3 rounded-lg bg-text-strong py-2 pl-5 pr-2 text-body-04 text-white shadow-lg ${
        isStandalone() ? 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]' : 'bottom-6'
      }`}
    >
      <span className="font-bold">새 버전이 있어요</span>

      <button
        type="button"
        onClick={() => void updateServiceWorker()}
        style={{ clipPath: pixelBox(2) }}
        className="bg-primary px-3 py-2 font-bold text-white transition-colors hover:bg-primary/90"
      >
        새로고침
      </button>

      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="px-2 py-2 text-white/70 transition-colors hover:text-white"
      >
        나중에
      </button>
    </div>
  )
}
