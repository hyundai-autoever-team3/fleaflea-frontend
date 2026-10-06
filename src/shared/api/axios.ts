import axios from 'axios'

import { env } from '../config/env'

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  // API가 다른 출처에 있어도 HttpOnly 리프레시 토큰 쿠키를 함께 전송한다.
  withCredentials: true,
})
