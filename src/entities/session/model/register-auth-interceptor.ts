import axios from 'axios'

import { api } from '../../../shared/api/axios'
import { useSessionStore } from './store'

const REISSUE_PATH = '/api/v1/auth/reissue'

// 재발급에 필요한 리프레시 토큰은 HttpOnly 쿠키로 전송한다.
function reissue() {
  // 재발급 실패가 다시 재발급을 호출하지 않도록 인터셉터가 없는 axios를 사용한다.
  return axios.post<{ accessToken: string }>(`${api.defaults.baseURL ?? ''}${REISSUE_PATH}`, null, {
    withCredentials: true,
  })
}

// 동시에 발생한 401 응답은 하나의 재발급 요청을 공유한다.
let refreshing: Promise<string> | null = null

export function refreshAccessToken() {
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

      const request = error.config as
        (typeof error.config & { retriedAfterReissue?: boolean }) | undefined

      // 재발급 후에도 401이 반복되면 같은 요청을 더 이상 재시도하지 않는다.
      if (error.response?.status !== 401 || !request || request.retriedAfterReissue) throw error
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

        // 재시도에서 발생한 오류를 전달해 입력 오류나 충돌도 화면에서 구분한다.
        throw retryError
      }
    },
  )
}
