import { isStandalone } from '../../shared/lib/pwa'

// 스플래시는 index.html에 직접 적혀 있어 자바스크립트보다 먼저 그려진다.
// 여기서는 앱이 준비된 뒤 그 화면을 걷어내는 일만 한다.

const MIN_VISIBLE_MS = 900
// index.html의 #splash transition 시간과 맞춘다
const FADE_MS = 300

export function hideSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return

  // 브라우저 탭에서는 CSS가 처음부터 숨겨 두므로 기다리지 않고 바로 지운다
  if (!isStandalone()) {
    splash.remove()
    return
  }

  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now())

  setTimeout(() => {
    splash.classList.add('is-leaving')

    setTimeout(() => splash.remove(), FADE_MS)
  }, remaining)
}
