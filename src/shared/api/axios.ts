import axios from 'axios'

import { env } from '../config/env'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  // 리프레시 토큰은 서버가 HttpOnly 쿠키로 내려준다. 배포 환경에서는 프론트와
  // 백엔드 도메인이 달라, 이 설정이 없으면 쿠키가 아예 실리지 않는다
  withCredentials: true,
})
