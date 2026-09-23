import { useEffect } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { type InfiniteData, type QueryClient, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import {
  notificationKeys,
  type NotificationItem,
  type NotificationUnreadCount,
} from '../../../entities/notification'
import { refreshAccessToken, useSessionStore } from '../../../entities/session'
import type { PageResponse } from '../../../shared/api/page-response'
import { env } from '../../../shared/config/env'

const RECONNECT_DELAY = 3_000
const NOTIFICATION_STREAM_PATH = '/api/v1/notifications/subscribe'

type NotificationPages = InfiniteData<PageResponse<NotificationItem>, number>

// onerror에서 다시 던지면 fetch-event-source의 자체 재연결을 멈춘다.
// 토큰이 바뀌거나 로그아웃되면 effect가 새 연결을 만들거나 기존 연결을 정리한다.
class StopSseError extends Error {}

function streamUrl() {
  return `${env.apiBaseUrl.replace(/\/$/, '')}${NOTIFICATION_STREAM_PATH}`
}

function isCached(queryClient: QueryClient, notificationId: number) {
  return queryClient
    .getQueriesData<NotificationPages>({ queryKey: notificationKeys.lists() })
    .some(([, current]) => current?.pages.some((page) => (
      page.content.some((notification) => notification.notificationId === notificationId)
    )))
}

// 이미 열어 본 알림 목록이 있으면 새 알림을 맨 앞에 넣는다.
// 여러 페이지가 캐시돼 있을 때는 각 페이지의 마지막 항목을 다음 페이지로 넘겨
// 페이지당 항목 수와 정렬 순서를 함께 유지한다.
function prependToCachedLists(queryClient: QueryClient, notification: NotificationItem) {
  queryClient.setQueriesData<NotificationPages>(
    { queryKey: notificationKeys.lists() },
    (current) => {
      if (!current || current.pages.some((page) => (
        page.content.some((item) => item.notificationId === notification.notificationId)
      ))) return current

      let carry: NotificationItem | undefined = notification
      const totalElements = (current.pages[0]?.totalElements ?? 0) + 1

      return {
        ...current,
        pages: current.pages.map((page) => {
          const candidates = carry ? [carry, ...page.content] : page.content
          const content = candidates.slice(0, page.size)
          carry = candidates[page.size]
          const totalPages = page.size > 0 ? Math.ceil(totalElements / page.size) : page.totalPages

          return {
            ...page,
            content,
            totalElements,
            totalPages,
            first: page.page === 0,
            last: page.page >= totalPages - 1,
            hasPrevious: page.page > 0,
            hasNext: page.page < totalPages - 1,
          }
        }),
      }
    },
  )
}

function receiveNotification(queryClient: QueryClient, notification: NotificationItem) {
  const alreadyCached = isCached(queryClient, notification.notificationId)
  prependToCachedLists(queryClient, notification)

  if (!notification.isRead && !alreadyCached) {
    queryClient.setQueryData<NotificationUnreadCount>(notificationKeys.unreadCount(), (current) => (
      current ? { unreadCount: current.unreadCount + 1 } : current
    ))
  }
}

function reconcileNotifications(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: notificationKeys.all }).catch(() => undefined)
}

export function NotificationRealtimeSync() {
  const queryClient = useQueryClient()
  const accessToken = useSessionStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) return

    const controller = new AbortController()

    void fetchEventSource(streamUrl(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
      signal: controller.signal,
      openWhenHidden: true,

      onopen: async (response) => {
        if (response.ok) return

        if (response.status === 401) {
          try {
            await refreshAccessToken()
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              useSessionStore.getState().clearSession()
              throw new StopSseError('notification SSE unauthorized')
            }
            throw error
          }

          // 갱신된 토큰으로 effect가 다시 실행되므로 만료 토큰 연결은 끝낸다.
          throw new StopSseError('notification SSE token refreshed')
        }

        throw new Error(`notification SSE open failed: ${response.status}`)
      },

      onmessage: (message) => {
        if (message.event === 'connect') {
          // 재연결 사이에 놓친 알림이 있을 수 있으므로 DB 기준으로 다시 맞춘다.
          reconcileNotifications(queryClient)
          return
        }
        if (message.event !== 'notification') return

        try {
          receiveNotification(queryClient, JSON.parse(message.data) as NotificationItem)
        } catch {
          // 형식이 잘못된 이벤트는 캐시에 넣지 않고 서버 조회로 복구한다.
          reconcileNotifications(queryClient)
        }
      },

      // 서버의 30분 연결 제한으로 정상 종료돼도 새 연결을 만든다.
      onclose: () => {
        throw new Error('notification SSE closed')
      },

      onerror: (error: unknown) => {
        if (error instanceof StopSseError) throw error
        return RECONNECT_DELAY
      },
    }).catch(() => undefined)

    return () => controller.abort()
  }, [accessToken, queryClient])

  return null
}
