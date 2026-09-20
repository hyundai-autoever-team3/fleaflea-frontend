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

export function useReadNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readNotification,
    onSuccess: (_response, notificationId) => {
      // 드롭다운을 다시 받기 전에 읽음 스타일과 배지를 먼저 반영한다.
      let wasUnread = false
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.infiniteLists() },
        (current) => current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                content: page.content.map((notification) => {
                  if (notification.notificationId !== notificationId) return notification
                  if (!notification.isRead) wasUnread = true
                  return { ...notification, isRead: true }
                }),
              })),
            }
          : current,
      )
      if (wasUnread) {
        queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), (current) => current
          ? { unreadCount: Math.max(0, current.unreadCount - 1) }
          : current,
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }).catch(() => undefined)
    },
  })
}

export function useReadAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readAllNotifications,
    onSuccess: () => {
      queryClient.setQueriesData<NotificationPages>(
        { queryKey: notificationKeys.infiniteLists() },
        (current) => current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                content: page.content.map((notification) => ({ ...notification, isRead: true })),
              })),
            }
          : current,
      )
      queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), (current) => current
        ? { unreadCount: 0 }
        : current,
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }).catch(() => undefined)
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
