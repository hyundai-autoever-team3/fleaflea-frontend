import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from './app/provider'
import './app/styles/index.css'
import { router } from './app/router/router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)

//서비스 워커 등록 : 배포 빌드에서만 등록
// 개발 서버에서 등록하면 코드를 수정해도 예전 파일이 보이는 문제가 생기기 쉬움
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW]등록 성공, 관리 범위: ', registration.scope)
      })
      .catch((error) => {
        console.error('[SW]등록 실패:', error)
      })
  })
}
