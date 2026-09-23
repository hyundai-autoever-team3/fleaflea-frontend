import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

import { queryClient } from '../../../shared/api/query-client'

interface SessionTokens {
    accessToken: string
}

// 리프레시 토큰은 HttpOnly 쿠키라 브라우저가 들고 있다. 여기서 다루지 않는다
interface SessionState {
    accessToken: string | null
    setSession: (tokens: SessionTokens, rememberMe?: boolean) => void
    // 토큰을 다시 받았을 때 접근 토큰만 갈아끼운다. 같은 사람의 같은 세션이므로
    // setSession과 달리 캐시를 비우지 않는다
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

        // 세션 저장소에서 복원했다면 이후에도 같은 저장소 사용
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

            setSession: (
                { accessToken },
                rememberMe = remember,
            ) => {
                remember = rememberMe
                // 이전 세션(가짜·만료 토큰, 다른 계정)의 조회 결과와 에러가 새 로그인에 남지 않도록 캐시 비움
                queryClient.clear()
                set({ accessToken })
            },

            setAccessToken: (accessToken) => set({ accessToken }),

            clearSession: () => {
                // 로그아웃 뒤 다른 계정으로 로그인했을 때 이전 사용자의 데이터가 보이지 않도록 캐시 비움
                queryClient.clear()
                // 메모리 상태를 먼저 초기화한 뒤 저장된 데이터도 삭제
                set({ accessToken: null })

                dualStorage.removeItem(SESSION_STORAGE_KEY)
                remember = true
            },
        }),
        {
            name: SESSION_STORAGE_KEY,
            storage: createJSONStorage(() => dualStorage),

            // 브라우저에 저장할 필드 명시
            partialize: (state) => ({
                accessToken: state.accessToken,
            }),
        },
    ),
)