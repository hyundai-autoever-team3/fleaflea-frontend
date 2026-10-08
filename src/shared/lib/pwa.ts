// 홈 화면에 설치한 앱으로 열렸는지 확인한다.
// 브라우저 탭에서는 false, 설치한 앱(주소창 없는 창)에서는 true.
export function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true

  // 예전 iOS 사파리는 display-mode 대신 navigator.standalone으로 알려준다
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}
