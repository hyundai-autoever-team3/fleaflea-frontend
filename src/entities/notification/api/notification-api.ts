import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { NotificationItem, NotificationUnreadCount } from '../model/types'

// 드롭다운은 한 판에 이만큼만 보여주고 나머지는 페이지로 넘긴다.
// 판 안에서 스크롤하지 않으려면 한 번에 그리는 줄 수가 고정돼야 한다
export const NOTIFICATION_PAGE_SIZE = 5

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (page: number, size: number) => [...notificationKeys.lists(), { page, size }] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 400 || status === 401 || status === 403 || status === 404) return false
  return failureCount < 3
}

export function getNotifications(page = 0, size = NOTIFICATION_PAGE_SIZE, signal?: AbortSignal) {
  // Swagger의 200 스키마가 공통 PageResponse로 연결돼 있지만,
  // 함께 제공되는 PageResponseNotificationResponse의 content 형태를 따른다.
  return api.get<PageResponse<NotificationItem>>('/api/v1/notifications', {
    params: { page, size },
    signal,
  })
}

export function useNotifications({ page = 0, size = NOTIFICATION_PAGE_SIZE, enabled = true } = {}) {
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: async ({ signal }) => (await getNotifications(page, size, signal)).data,
    enabled,
    retry: retryUnlessClientError,
    // 닫혀 있는 동안 새 알림이 생길 수 있으므로 열 때마다 최신 목록을 확인한다.
    staleTime: 0,
    // 페이지를 넘길 때 판이 비었다가 다시 차오르지 않게 이전 장을 붙잡아 둔다
    placeholderData: keepPreviousData,
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
