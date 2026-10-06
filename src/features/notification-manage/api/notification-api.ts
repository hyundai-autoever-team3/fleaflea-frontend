import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import {
  notificationKeys,
  type NotificationItem,
  type NotificationUnreadCount,
} from '../../../entities/notification'
import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'

type NotificationPages = InfiniteData<PageResponse<NotificationItem>, number>

export function readNotification(notificationId: number) {
  return api.patch<void>(`/api/v1/notifications/${notificationId}/read`)
}

export function readAllNotifications() {
  return api.patch<void>('/api/v1/notifications/read-all')
}

export function deleteNotification(notificationId: number) {
  return api.delete<void>(`/api/v1/notifications/${notificationId}`)
}

export function deleteAllNotifications() {
  return api.delete<void>('/api/v1/notifications')
}

// 알림이 저장된 페이지를 특정할 수 없으므로 캐시된 모든 페이지를 갱신한다.
function updateCachedNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  notificationId: number,
  change: (notification: NotificationItem) => NotificationItem,
) {
  queryClient.setQueriesData<NotificationPages>(
    { queryKey: notificationKeys.lists() },
    (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              content: page.content.map((notification) =>
                notification.notificationId === notificationId
                  ? change(notification)
                  : notification,
              ),
            })),
          }
        : current,
  )
}

function decreaseUnreadCount(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), (current) =>
    current ? { unreadCount: Math.max(0, current.unreadCount - 1) } : current,
  )
}

function wasUnread(queryClient: ReturnType<typeof useQueryClient>, notificationId: number) {
  for (const [, cached] of queryClient.getQueriesData<NotificationPages>({
    queryKey: notificationKeys.lists(),
  })) {
    for (const page of cached?.pages ?? []) {
      const found = page.content.find(
        (notification) => notification.notificationId === notificationId,
      )
      if (found) return !found.isRead
    }
  }

  return false
}

export function useReadNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readNotification,
    onSuccess: (_response, notificationId) => {
      // 캐시를 읽음으로 바꾸기 전에 이전 상태를 확인해 배지를 중복 차감하지 않는다.
      const unread = wasUnread(queryClient, notificationId)
      updateCachedNotification(queryClient, notificationId, (notification) => ({
        ...notification,
        isRead: true,
      }))
      if (unread) decreaseUnreadCount(queryClient)
    },
    onSettled: () => {
      void queryClient
        .invalidateQueries({ queryKey: notificationKeys.unreadCount() })
        .catch(() => undefined)
    },
  })
}

export function useReadAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: () => {
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.lists() },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  content: page.content.map((notification) => ({ ...notification, isRead: true })),
                })),
              }
            : current,
      )
      queryClient.setQueryData<NotificationUnreadCount>(
        notificationKeys.unreadCount(),
        (current) => (current ? { unreadCount: 0 } : current),
      )
    },
    onSettled: () => {
      void queryClient
        .invalidateQueries({ queryKey: notificationKeys.unreadCount() })
        .catch(() => undefined)
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: async (_response, notificationId) => {
      // 삭제로 페이지 경계가 바뀌므로 목록을 다시 조회한다. 읽지 않은 알림만 배지에서 뺀다.
      if (wasUnread(queryClient, notificationId)) decreaseUnreadCount(queryClient)

      await Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
        ].map((task) => task.catch(() => undefined)),
      )
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: async () => {
      // 전체 삭제 직후 배지를 먼저 초기화하고 서버 값과 다시 동기화한다.
      queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), {
        unreadCount: 0,
      })

      await Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
        ].map((task) => task.catch(() => undefined)),
      )
    },
  })
}

export function getNotificationActionErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 403:
      return '이 알림을 변경할 수 없어요.'
    case 404:
      return '이미 사라진 알림이에요.'
    default:
      return '알림 상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
