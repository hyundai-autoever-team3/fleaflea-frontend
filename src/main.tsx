import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { AppProviders } from './app/provider'
import './app/styles/index.css'
import { router } from './app/router/router'
import { hideSplash } from './app/pwa/splash'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)

// 첫 화면을 그리기 시작했으니 index.html의 스플래시를 걷어낸다
hideSplash()
