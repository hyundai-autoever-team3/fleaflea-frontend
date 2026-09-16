// .env는 git에 올라가지 않아서 새로 클론한 환경에는 없음 → 없으면 개발 서버 프록시('/api')로 기본 설정
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
}
