import { isStandalone } from '../../shared/lib/pwa'

// 설치한 앱에서만 화면을 기기 끝(아이폰 홈 막대 영역)까지 쓴다.
// 가려지는 만큼은 각 화면이 env(safe-area-inset-*)로 직접 띄운다. 브라우저 탭은 기존 그대로 둔다
export function fitViewportInApp() {
  if (!isStandalone()) return

  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover')
}
