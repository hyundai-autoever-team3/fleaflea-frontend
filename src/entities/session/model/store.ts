import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

import { queryClient } from '../../../shared/api/query-client'

interface SessionTokens {
  accessToken: string
}

// 리프레시 토큰은 HttpOnly 쿠키에 있으므로 접근 토큰만 저장한다.
interface SessionState {
  accessToken: string | null
  setSession: (tokens: SessionTokens, rememberMe?: boolean) => void
  // 같은 세션의 토큰 재발급은 조회 캐시를 유지한다.
  setAccessToken: (accessToken: string) => void
  clearSession: () => void
}

const SESSION_STORAGE_KEY = 'fleaflea-session'

let remember = true

const dualStorage: StateStorage = {
  getItem: (name) => {
    const localValue = localStorage.getItem(name)

    if (localValue !== null) {
      remember = true
      return localValue
    }

    const sessionValue = sessionStorage.getItem(name)

    // 복원한 저장소를 계속 사용하고, 저장된 값이 없으면 localStorage를 기본으로 한다.
    remember = sessionValue === null

    return sessionValue
  },

  setItem: (name, value) => {
    if (remember) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },

  removeItem: (name) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,

      setSession: ({ accessToken }, rememberMe = remember) => {
        remember = rememberMe

        // 새 로그인에 이전 계정의 데이터와 조회 오류가 남지 않도록 캐시를 비운다.
        queryClient.clear()
        set({ accessToken })
      },

      setAccessToken: (accessToken) => set({ accessToken }),

      clearSession: () => {
        // 로그아웃과 함께 계정에 종속된 조회 결과도 삭제한다.
        queryClient.clear()
        set({ accessToken: null })

        // persist가 저장한 초기 상태까지 삭제해야 다음 실행을 빈 세션으로 시작한다.
        dualStorage.removeItem(SESSION_STORAGE_KEY)
        remember = true
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => dualStorage),

      partialize: (state) => ({
        accessToken: state.accessToken,
      }),
    },
  ),
)
