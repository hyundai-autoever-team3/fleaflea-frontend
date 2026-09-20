import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
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
    proxy: {
      '/api': {
        target: 'https://fleaflea.duckdns.org',
        changeOrigin: true,
      },
    },
  },
})
