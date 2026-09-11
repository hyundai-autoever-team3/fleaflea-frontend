import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { User } from '../../user'

interface SessionState {
  token: string | null
  currentUser: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

// Persisted so a page refresh doesn't drop the login. app/router reads `token` to
// decide public vs. protected routes; features/auth is the only slice that calls
// setSession/clearSession (after login/signup/logout API calls).
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      currentUser: null,
      setSession: (token, user) => set({ token, currentUser: user }),
      clearSession: () => set({ token: null, currentUser: null }),
    }),
    { name: 'fleaflea-session' },
  ),
)
