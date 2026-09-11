import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

import { useSessionStore } from '../../entities/session'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

export function RequireGuest({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token)
  if (token) return <Navigate to="/home" replace />
  return children
}
