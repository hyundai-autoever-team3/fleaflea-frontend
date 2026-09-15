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
    // 백엔드에 CORS 설정이 아직 없어서 개발 중 임시로 우회 — 배포 시엔 백엔드 CORS 허용이 필요함
    proxy: {
      '/api': {
        target: 'http://3.38.188.158',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
