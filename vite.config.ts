import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// 개발 서버와 미리보기가 같은 규칙을 쓰도록 한곳에 둔다.
// vite preview는 server.proxy를 읽지 않으므로 따로 넘겨야 한다.
//
// 경로를 손대지 않고 그대로 넘긴다. 예전에는 VITE_API_BASE_URL에 '/api'를 넣어
// '/api'가 두 번 붙었고 앞의 하나를 rewrite로 떼어냈는데, 그러면 브라우저가 보는 경로가
// '/api/api/v1/...'이 된다. 서버는 맞지만 쿠키가 어긋난다 — 리프레시 토큰 쿠키의
// Path가 '/api/v1/auth'라, 브라우저 경로와 맞지 않으면 재발급 요청에 실리지 않는다.
// 개발에서는 VITE_API_BASE_URL을 비워 두고 코드의 '/api/v1/...'을 그대로 쓴다
const apiProxy = {
  '/api': {
    target: 'https://fleaflea.duckdns.org',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    // 개발 중에는 프록시를 거쳐 호출해 CORS·혼합 콘텐츠를 신경 쓰지 않아도 되게 함.
    // 배포 환경에는 프록시가 없으므로 VITE_API_BASE_URL에 전체 주소를 넣어야 하고,
    // 그때는 백엔드 CORS에 배포 도메인이 등록돼 있어야 함
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
