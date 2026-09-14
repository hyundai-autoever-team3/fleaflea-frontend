import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { User } from '../../user'

interface SessionState {
  token: string | null
  currentUser: User | null
  setSession: (token: string, user: User, remember?: boolean) => void
  clearSession: () => void
}

// "로그인 상태 유지" 체크 여부에 따라 실제 쓰기 대상만 바꾸는 저장소.
// remember=true → localStorage(브라우저 껐다 켜도 유지), false → sessionStorage(탭 닫으면 삭제).
// 어디서 읽어와야 할지 모르니 getItem은 둘 다 확인한다.
let remember = true

const dualStorage = {
  getItem: (name: string) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name: string, value: string) => {
    if (remember) {
      localStorage.setItem(name, value)
      sessionStorage.removeItem(name)
    } else {
      sessionStorage.setItem(name, value)
      localStorage.removeItem(name)
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

// Persisted so a page refresh doesn't drop the login. app/router reads `token` to
// decide public vs. protected routes; features/auth is the only slice that calls
// setSession/clearSession (after login/signup/logout API calls).
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      setSession: (token, user, rememberMe = true) => {
        remember = rememberMe
        set({ token, currentUser: user })
      },
      clearSession: () => set({ token: null, currentUser: null }),
    }),
    { name: 'fleaflea-session', storage: createJSONStorage(() => dualStorage) },
  ),
)
