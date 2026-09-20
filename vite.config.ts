import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// 개발 서버와 미리보기가 같은 규칙을 쓰도록 한곳에 둔다.
// vite preview는 server.proxy를 읽지 않으므로 따로 넘겨야 한다.
//
// rewrite가 필요한 이유: VITE_API_BASE_URL이 '/api'라 axios가 앞에 '/api'를 붙이고,
// 코드의 경로도 '/api/v1/...'로 시작한다. 그래서 브라우저는 '/api/api/v1/...'로 보낸다.
// 앞의 '/api'(프록시를 타기 위한 표시)만 떼어내야 백엔드의 '/api/v1/...'과 맞는다
const apiProxy = {
  '/api': {
    target: 'https://fleaflea.duckdns.org',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5175,
    strictPort: true,
    // 개발 중에는 프록시를 거쳐 호출해 CORS·혼합 콘텐츠를 신경 쓰지 않아도 되게 함.
    // 백엔드 경로가 /api/v1/... 이라 경로를 그대로 넘긴다 (예전에 /api를 떼어내 401이 났다).
    // 배포 환경에는 프록시가 없으므로 VITE_API_BASE_URL에 전체 주소를 넣어야 하고,
    // 그때는 백엔드 CORS에 배포 도메인이 등록돼 있어야 함
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    proxy: apiProxy,
  },
})
