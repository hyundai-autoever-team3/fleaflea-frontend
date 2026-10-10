import { registerSW } from 'virtual:pwa-register'

// 서비스 워커를 등록한다. 새 버전 안내는 띄우지 않는다.
// 새 서비스 워커는 대기하다가 앱(또는 탭)을 모두 닫았다 열 때 저절로 교체된다.
// 그 전에도 화면 파일은 실행할 때마다 서버에서 새로 받으므로 예전 화면에 머물지 않는다
export function registerServiceWorker() {
  registerSW()
}
