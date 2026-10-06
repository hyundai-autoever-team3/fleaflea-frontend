import { LoadingScreen } from '../../shared/ui/loading-screen'

// 지연 로딩 경로로 직접 접속했을 때 초기 빈 화면을 대신한다.
export function RouteFallback() {
  return <LoadingScreen message="화면을 불러오는 중이에요" />
}
