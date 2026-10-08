// 온보딩(첫 실행 소개 화면)을 이미 봤는지 기기에 기억해 둔다.
// 로그인 전에 보는 화면이라 서버가 아닌 localStorage에 남긴다.
const ONBOARDING_SEEN_KEY = 'fleaflea-onboarding-seen'

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) !== null
  } catch {
    // 저장소를 읽을 수 없으면 기록도 남길 수 없다. 봤다고 쳐야 매번 소개 화면에 갇히지 않는다
    return true
  }
}

export function markOnboardingSeen() {
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, '1')
  } catch {
    // 저장에 실패해도 다음 화면으로 넘어가는 것은 막지 않는다
  }
}
