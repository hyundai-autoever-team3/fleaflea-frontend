// .env는 git에 올라가지 않아서 새로 클론한 환경에는 없음.
// 없으면 빈 값 → 코드의 '/api/v1/...'을 그대로 요청하고 개발 서버 프록시가 받는다.
// 배포에서도 비워 두면 vercel.json의 rewrite가 같은 경로를 백엔드로 넘긴다
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
}
