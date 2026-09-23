import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { registerAuthInterceptor } from '../../entities/session'
import { NotificationRealtimeSync } from '../../features/notification-manage'
import { queryClient } from '../../shared/api/query-client'
import { Toast } from '../../shared/ui/toast'

// Runs once on app startup, before the first render.
registerAuthInterceptor()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <NotificationRealtimeSync />
      <Toast />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
