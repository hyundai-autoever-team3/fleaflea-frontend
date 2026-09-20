import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { NotificationItem, NotificationUnreadCount } from '../model/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  infiniteLists: () => [...notificationKeys.all, 'infinite-list'] as const,
  infiniteList: (size: number) => [...notificationKeys.infiniteLists(), { size }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

export function getNotifications(page = 0, size = 10, signal?: AbortSignal) {
  // Swagger의 200 스키마가 공통 PageResponse로 연결돼 있지만,
  // 함께 제공되는 PageResponseNotificationResponse의 content 형태를 따른다.
  return api.get<PageResponse<NotificationItem>>('/api/v1/notifications', {
    params: { page, size },
    signal,
  })
}

export function useInfiniteNotifications({ size = 10, enabled = true } = {}) {
  return useInfiniteQuery({
    queryKey: notificationKeys.infiniteList(size),
    queryFn: async ({ pageParam, signal }) => (await getNotifications(pageParam, size, signal)).data,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.page + 1 : undefined,
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
    // 실시간 연결 명세가 없으므로, 헤더 배지는 가벼운 주기 조회로 갱신한다.
    refetchInterval: 60_000,
  })
}
