import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import {
  notificationKeys,
  type NotificationItem,
  type NotificationUnreadCount,
} from '../../../entities/notification'
import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'

type NotificationPage = PageResponse<NotificationItem>

export function readNotification(notificationId: number) {
  return api.patch<void>(`/api/v1/notifications/${notificationId}/read`)
}

export function readAllNotifications() {
  return api.patch<void>('/api/v1/notifications/read-all')
}

export function deleteNotification(notificationId: number) {
  return api.delete<void>(`/api/v1/notifications/${notificationId}`)
}

// 받아둔 모든 장에서 알림 한 건을 찾아 바꾼다. 어느 장에 있었는지는 알 수 없다
function updateCachedNotification(
  queryClient: ReturnType<typeof useQueryClient>,
  notificationId: number,
  change: (notification: NotificationItem) => NotificationItem,
) {
  queryClient.setQueriesData<NotificationPage>(
    { queryKey: notificationKeys.lists() },
    (current) => current
      ? {
          ...current,
          content: current.content.map((notification) => notification.notificationId === notificationId
            ? change(notification)
            : notification),
        }
      : current,
  )
}

function decreaseUnreadCount(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), (current) => current
    ? { unreadCount: Math.max(0, current.unreadCount - 1) }
    : current,
  )
}

function wasUnread(queryClient: ReturnType<typeof useQueryClient>, notificationId: number) {
  for (const [, page] of queryClient.getQueriesData<NotificationPage>({ queryKey: notificationKeys.lists() })) {
    const found = page?.content.find((notification) => notification.notificationId === notificationId)
    if (found) return !found.isRead
  }
  return false
}

export function useReadNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: readNotification,
    onSuccess: (_response, notificationId) => {
      // 목록을 다시 받기 전에 읽음 스타일과 배지를 먼저 반영한다.
      const unread = wasUnread(queryClient, notificationId)
      updateCachedNotification(queryClient, notificationId, (notification) => ({ ...notification, isRead: true }))
      if (unread) decreaseUnreadCount(queryClient)
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
      queryClient.setQueriesData<NotificationPage>(
        { queryKey: notificationKeys.lists() },
        (current) => current
          ? {
              ...current,
              content: current.content.map((notification) => ({ ...notification, isRead: true })),
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

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: async (_response, notificationId) => {
      // 지운 줄이 빠지면 뒷장의 알림이 한 칸씩 당겨 올라오므로 장 전체를 다시 받는다.
      // 읽지 않은 알림을 지웠다면 배지 숫자도 하나 줄어든다
      if (wasUnread(queryClient, notificationId)) decreaseUnreadCount(queryClient)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() }),
      ].map((task) => task.catch(() => undefined)))
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
