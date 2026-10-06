import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { NotificationItem, NotificationUnreadCount } from '../model/types'

export const NOTIFICATION_PAGE_SIZE = 10

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (size: number) => [...notificationKeys.lists(), { size }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 400 || status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

export function getNotifications(page = 0, size = NOTIFICATION_PAGE_SIZE, signal?: AbortSignal) {
  // 공통 페이지 스키마의 content를 알림 응답 타입으로 구체화한다.
  return api.get<PageResponse<NotificationItem>>('/api/v1/notifications', {
    params: { page, size },
    signal,
  })
}

export function useInfiniteNotifications({ size = NOTIFICATION_PAGE_SIZE, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(size),
    queryFn: async ({ pageParam, signal }) =>
      (await getNotifications(pageParam, size, signal)).data,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled,
    retry: retryUnlessClientError,
    // 닫혀 있는 동안 새 알림이 생길 수 있으므로 열 때마다 최신 목록을 확인한다.
    staleTime: 0,
  })
}

export function getUnreadNotificationCount() {
  return api.get<NotificationUnreadCount>('/api/v1/notifications/unread-count')
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => (await getUnreadNotificationCount()).data,
    retry: retryUnlessClientError,
    staleTime: 30_000,
  })
}
