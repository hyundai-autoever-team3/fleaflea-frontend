import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { registerAuthInterceptor } from '../../entities/session'
import { NotificationRealtimeSync } from '../../features/notification-manage'
import { queryClient } from '../../shared/api/query-client'
import { Toast } from '../../shared/ui/toast'
import { UpdatePrompt } from '../pwa/UpdatePrompt'
import { AppBadgeSync } from '../pwa/AppBadgeSync'

// 첫 API 요청보다 먼저 등록하고, 컴포넌트 재렌더링으로 인터셉터가 중복되지 않게 한다.
registerAuthInterceptor()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <NotificationRealtimeSync />
      <Toast />
      <UpdatePrompt />
      <AppBadgeSync />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
