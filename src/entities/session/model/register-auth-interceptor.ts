import axios from 'axios'

import { api } from '../../../shared/api/axios'
import { useSessionStore } from './store'

const REISSUE_PATH = '/api/v1/auth/reissue'

// 접근 토큰이 만료되면 서버는 401만 돌려준다. 되살리지 않으면 로그아웃할 때까지
// 모든 요청이 401로 막혀, 화면은 멀쩡한데 누르는 것마다 실패하는 상태가 된다.
// 리프레시 토큰은 HttpOnly 쿠키라 본문에 실을 것이 없다 — 브라우저가 붙여 보낸다
function reissue() {
  // 기본 axios로 보낸다. api로 보내면 만료된 토큰이 다시 실리고,
  // 이 응답이 401일 때 아래 처리가 또 돌아 재귀에 빠진다
  return axios.post<{ accessToken: string }>(
    `${api.defaults.baseURL ?? ''}${REISSUE_PATH}`,
    null,
    { withCredentials: true },
  )
}

// 토큰이 만료되면 여러 요청이 한꺼번에 401을 받는다.
// 재발급은 한 번만 보내고 나머지는 그 결과를 함께 기다린다
let refreshing: Promise<string> | null = null

function refreshAccessToken() {
  refreshing ??= (async () => {
    const { data } = await reissue()
    useSessionStore.getState().setAccessToken(data.accessToken)
    return data.accessToken
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

export function registerAuthInterceptor() {
  api.interceptors.request.use((config) => {
    const accessToken = useSessionStore.getState().accessToken
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error
      const request = error.config as (typeof error.config & { retriedAfterReissue?: boolean }) | undefined
      // 한 요청당 한 번만 다시 보낸다. 재발급 뒤에도 401이면 정말 권한이 없는 것이다
      if (error.response?.status !== 401 || !request || request.retriedAfterReissue) throw error
      // 로그인한 적이 없으면 되살릴 세션도 없다
      if (!useSessionStore.getState().accessToken) throw error

      request.retriedAfterReissue = true
      try {
        const accessToken = await refreshAccessToken()
        request.headers.Authorization = `Bearer ${accessToken}`
        return await api.request(request)
      } catch (retryError) {
        // 재발급이나 재요청이 401일 때만 세션을 지운다.
        // 네트워크·서버 오류나 입력 오류는 로그인 만료를 뜻하지 않는다.
        if (axios.isAxiosError(retryError) && retryError.response?.status === 401) {
          useSessionStore.getState().clearSession()
        }
        // 실제 실패 원인을 넘겨 화면이 입력 오류·충돌 등을 올바르게 안내하게 한다.
        throw retryError
      }
    },
  )
}
