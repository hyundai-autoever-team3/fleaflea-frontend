import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// 개발 서버와 미리보기가 같은 규칙을 쓰도록 한곳에 둔다.
// vite preview는 server.proxy를 읽지 않으므로 따로 넘겨야 한다.
//
// 경로를 손대지 않고 그대로 넘긴다. 예전에는 VITE_API_BASE_URL에 '/api'를 넣어
// '/api'가 두 번 붙었고 앞의 하나를 rewrite로 떼어냈는데, 그러면 브라우저가 보는 경로가
// '/api/api/v1/...'이 된다. 서버는 맞지만 쿠키가 어긋난다 — 리프레시 토큰 쿠키의
// Path가 '/api/v1/auth'라, 브라우저 경로와 맞지 않으면 재발급 요청에 실리지 않는다.
// VITE_API_BASE_URL을 비워 두고 코드의 '/api/v1/...'을 그대로 쓴다.
// 개발에서는 아래 프록시가, 배포에서는 vercel.json의 rewrite가 백엔드로 넘긴다
const apiProxy = {
  '/api': {
    target: 'https://api.fleaflea.app',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 새 버전이 와도 쓰던 화면을 바로 바꾸지 않는다. 앱을 닫았다 열 때 교체된다
      registerType: 'prompt',

      // manifest는 3번에서 만든 public/manifest.webmanifest를 그대로 쓴다
      manifest: false,

      // 등록은 src/app/pwa/register.ts가 하므로 플러그인이 등록 코드를 따로 넣지 않게 한다
      injectRegister: false,

      workbox: {
        // 사전 저장: 설치할 때 미리 받아 둘 파일
        globPatterns: ['**/*.{js,css,html}', 'fonts/*', 'icons/*.png', 'mascot/flea4.png'],
        // MSW(API 목업)용 파일은 앱에서 쓰지 않으므로 저장하지 않는다
        globIgnores: ['mockServiceWorker.js'],
        // SPA 기본 동작(모든 주소에 index.html)을 끄고, 아래에서 오프라인 화면으로 대신한다
        navigateFallback: null,
        runtimeCaching: [
          {
            // 페이지 이동: 항상 서버에서 받고, 끊기면 오프라인 화면
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
            options: {
              precacheFallback: {
                fallbackURL: '/offline.html',
              },
            },
          },
          {
            // 마스코트 이미지: 한 번 받으면 저장해 두고 다음부터 바로 사용한다
            urlPattern: ({ url }) => url.pathname.startsWith('/mascot/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fleaflea-mascots',
              expiration: { maxEntries: 20 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    // 개발 중에는 프록시를 거쳐 호출해 CORS·혼합 콘텐츠를 신경 쓰지 않아도 되게 함.
    // 배포에서도 같은 경로를 쓰며 vercel.json의 rewrite가 백엔드로 넘긴다
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
