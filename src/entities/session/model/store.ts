import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'

import { queryClient } from '../../../shared/api/query-client'
import type { User } from '../../user'

interface SessionTokens {
    accessToken: string
    refreshToken: string
}

interface SessionState {
    accessToken: string | null
    refreshToken: string | null
    currentUser: User | null
    setSession: (tokens: SessionTokens, rememberMe?: boolean) => void
    setCurrentUser: (user: User | null) => void
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
            refreshToken: null,
            currentUser: null,

            setSession: (
                { accessToken, refreshToken },
                rememberMe = remember,
            ) => {
                remember = rememberMe
                // 이전 세션(가짜·만료 토큰, 다른 계정)의 조회 결과와 에러가 새 로그인에 남지 않도록 캐시 비움
                queryClient.clear()
                set({ accessToken, refreshToken })
            },

            setCurrentUser: (user) => {
                set({ currentUser: user })
            },

            clearSession: () => {
                // 로그아웃 뒤 다른 계정으로 로그인했을 때 이전 사용자의 데이터가 보이지 않도록 캐시 비움
                queryClient.clear()
                // 메모리 상태를 먼저 초기화한 뒤 저장된 데이터도 삭제
                set({
                    accessToken: null,
                    refreshToken: null,
                    currentUser: null,
                })

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
                refreshToken: state.refreshToken,
                currentUser: state.currentUser,
            }),
        },
    ),
)