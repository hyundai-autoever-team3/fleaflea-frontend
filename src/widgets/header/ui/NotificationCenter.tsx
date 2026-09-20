import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  BellIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  HandRaisedIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router'

import {
  type NotificationItem,
  type NotificationReferenceType,
  type NotificationType,
  useInfiniteNotifications,
  useUnreadNotificationCount,
} from '../../../entities/notification'
import {
  getNotificationActionErrorMessage,
  useReadAllNotifications,
  useReadNotification,
} from '../../../features/notification-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { useToastStore } from '../../../shared/ui/toast'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const PANEL_BUTTON = 'flex min-h-9 items-center gap-1.5 rounded-lg bg-bg px-3 text-body-04 font-bold text-text transition-colors hover:bg-primary-tint'

interface NotificationTypeStyle {
  label: string
  textClass: string
}

// 종류를 알아보는 건 라벨 한 단어가 맡는다. 색도 그 단어에만 주고
// 아이콘·바탕은 무채색으로 둬 줄마다 색이 튀지 않게 한다.
// 색 값은 tokens.css의 status 토큰만 쓴다 (design.md 9장 — 컴포넌트에 hex 금지)
const TYPE_STYLE: Record<NotificationType, NotificationTypeStyle> = {
  TRADE_REQUESTED: { label: '교환', textClass: 'text-status-brand' },
  TRADE_ACCEPTED: { label: '수락', textClass: 'text-status-info' },
  TRADE_REJECTED: { label: '거절', textClass: 'text-status-danger' },
  TRADE_CANCELLED: { label: '취소', textClass: 'text-text-muted' },
  TRADE_COMPLETED: { label: '완료', textClass: 'text-status-success' },
  FRIEND_REQUESTED: { label: '친구 요청', textClass: 'text-status-accent' },
  FRIEND_ACCEPTED: { label: '친구 수락', textClass: 'text-status-info' },
  POKE_RECEIVED: { label: '콕 찌르기', textClass: 'text-status-warning' },
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const className = 'size-5'
  switch (type) {
    case 'TRADE_REQUESTED':
      return <ArrowsRightLeftIcon aria-hidden="true" className={className} />
    case 'TRADE_ACCEPTED':
      return <CheckCircleIcon aria-hidden="true" className={className} />
    case 'TRADE_REJECTED':
      return <XCircleIcon aria-hidden="true" className={className} />
    case 'TRADE_CANCELLED':
      return <ArrowUturnLeftIcon aria-hidden="true" className={className} />
    case 'TRADE_COMPLETED':
      return <CheckBadgeIcon aria-hidden="true" className={className} />
    case 'FRIEND_REQUESTED':
      return <UserPlusIcon aria-hidden="true" className={className} />
    case 'FRIEND_ACCEPTED':
      return <UserGroupIcon aria-hidden="true" className={className} />
    case 'POKE_RECEIVED':
      return <HandRaisedIcon aria-hidden="true" className={className} />
  }
}

const DESTINATION: Record<NotificationReferenceType, string> = {
  ITEM_TRADE_REQUEST: '/my-page',
  COLLECTION_TRADE_REQUEST: '/my-page',
  BEG_REQUEST: '/my-page',
  FRIENDSHIP: '/friends',
  MEMBER_POKE: '/friends',
}

function toDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function relativeTime(value: string) {
  const date = toDate(value)
  if (!date) return '시간 정보 없음'

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return '방금 전'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`

  return new Intl.DateTimeFormat('ko-KR', {
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function fullDate(value: string) {
  const date = toDate(value)
  if (!date) return undefined
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function NotificationRow({
  notification,
  reading,
  onSelect,
  onRead,
}: {
  notification: NotificationItem
  reading: boolean
  onSelect: (notification: NotificationItem) => void
  onRead: (notification: NotificationItem) => void
}) {
  const unread = !notification.isRead
  const typeStyle = TYPE_STYLE[notification.type]

  return (
    // 읽은 알림은 지우지 않고 색을 죽여 가라앉힌다
    <li className={`relative flex items-start gap-2.5 rounded-xl p-2.5 transition-colors ${unread ? 'bg-bg' : 'bg-bg/55'}`}>
      <span
        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary-subtle ${
          unread ? 'text-text' : 'text-text-muted'
        }`}
      >
        <NotificationIcon type={notification.type} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${unread ? typeStyle.textClass : 'text-text-muted'}`}>
            {typeStyle.label}
          </span>
          <time
            dateTime={notification.createdAt}
            title={fullDate(notification.createdAt)}
            className="ml-auto shrink-0 text-[11px] text-text-muted"
          >
            {relativeTime(notification.createdAt)}
          </time>
        </div>

        {/* 줄 전체가 눌리도록 넓히되, 옆의 읽음 버튼은 z-10으로 위에 띄운다 */}
        <button
          type="button"
          onClick={() => onSelect(notification)}
          className={`mt-1 block w-full text-left text-body-04 leading-5 after:absolute after:inset-0 after:content-[''] ${
            unread ? 'font-bold text-text-strong' : 'text-text-muted'
          } ${FOCUS_RING}`}
        >
          {notification.message}
        </button>
      </div>

      {unread && (
        // 화면을 옮기지 않고 이 알림만 읽음으로 넘기고 싶을 때 쓴다
        <button
          type="button"
          onClick={() => onRead(notification)}
          disabled={reading}
          aria-label={`${typeStyle.label} 알림을 읽음으로 표시`}
          className={`relative z-10 mt-0.5 flex min-h-9 shrink-0 items-center gap-1 self-start rounded-lg bg-primary-subtle px-2 text-[11px] font-bold text-text transition-colors hover:bg-primary-tint disabled:opacity-50 ${FOCUS_RING}`}
        >
          <CheckIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {reading ? '처리 중' : '읽음'}
        </button>
      )}
    </li>
  )
}

function NotificationSkeleton() {
  return (
    <div role="status" aria-label="알림을 불러오는 중" className="space-y-2 p-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-start gap-2.5 rounded-xl bg-bg/55 p-2.5 motion-safe:animate-pulse">
          <span className="size-9 shrink-0 rounded-lg bg-primary-tint" />
          <span className="mt-1 h-10 flex-1 rounded-lg bg-primary-subtle" />
        </div>
      ))}
    </div>
  )
}

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const panelId = useId()
  const titleId = useId()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLLIElement>(null)
  const [readingIds, setReadingIds] = useState<number[]>([])
  const notificationsQuery = useInfiniteNotifications({ enabled: open })
  const unreadCountQuery = useUnreadNotificationCount()
  const readNotificationMutation = useReadNotification()
  const readAllMutation = useReadAllNotifications()
  const {
    data: notificationPages,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = notificationsQuery

  const notifications = useMemo(() => {
    const byId = new Map<number, NotificationItem>()
    for (const page of notificationPages?.pages ?? []) {
      for (const notification of page.content) {
        if (!byId.has(notification.notificationId)) byId.set(notification.notificationId, notification)
      }
    }
    return [...byId.values()]
  }, [notificationPages])
  const rawUnreadCount = unreadCountQuery.data?.unreadCount ?? 0
  const unreadCount = Math.max(0, Number.isFinite(rawUnreadCount) ? rawUnreadCount : 0)
  const hasUnread = unreadCount > 0 || notifications.some((notification) => !notification.isRead)
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      onOpenChange(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onOpenChange, open])

  useEffect(() => {
    const target = loadMoreRef.current
    const root = scrollAreaRef.current
    if (!open || !target || !root || !hasNextPage || isFetchNextPageError) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { root, rootMargin: '96px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    open,
  ])

  function togglePanel() {
    const nextOpen = !open
    onOpenChange(nextOpen)
    if (nextOpen) void unreadCountQuery.refetch()
  }

  function showMutationError(error: unknown) {
    useToastStore.getState().showToast(getNotificationActionErrorMessage(error))
  }

  // 알림마다 따로 눌리므로, 어느 줄이 처리 중인지도 줄 단위로 기억한다
  function markAsRead(notification: NotificationItem) {
    const { notificationId } = notification
    if (readingIds.includes(notificationId)) return
    setReadingIds((current) => [...current, notificationId])
    readNotificationMutation.mutate(notificationId, {
      onError: showMutationError,
      onSettled: () => setReadingIds((current) => current.filter((id) => id !== notificationId)),
    })
  }

  function selectNotification(notification: NotificationItem) {
    if (!notification.isRead) markAsRead(notification)
    onOpenChange(false)
    void navigate(DESTINATION[notification.referenceType], { viewTransition: true })
  }

  function readAll() {
    if (readAllMutation.isPending) return
    readAllMutation.mutate(undefined, {
      onSuccess: () => triggerRef.current?.focus(),
      onError: showMutationError,
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={togglePanel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={unreadCount > 0 ? `알림, 읽지 않은 알림 ${unreadCount}개` : '알림'}
        className={`relative flex size-11 items-center justify-center transition-colors hover:text-primary ${
          open || unreadCount > 0 ? 'text-text-strong' : 'text-text-muted'
        } ${FOCUS_RING}`}
      >
        <BellIcon aria-hidden="true" className="size-6" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-bg"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        // 잠깐 떴다 사라지는 조작용 판이라 픽셀 계단 대신 둥근 모서리를 쓴다
        // (프로필 메뉴·거래 출처 목록과 같은 예외 — design.md 1장)
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          aria-busy={notificationsQuery.isPending || isFetchingNextPage}
          className="fixed inset-x-4 top-[6.75rem] z-50 flex max-h-[calc(100dvh-7.75rem)] flex-col overflow-hidden rounded-2xl border border-primary-tint/60 bg-primary-subtle/85 shadow-lg backdrop-blur-md md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[calc(100dvh-5rem)] md:w-96"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-body-03 font-bold text-text-strong">알림</h2>
              <p className="mt-0.5 text-xs text-text-muted">
                {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '새 소식을 확인해 보세요'}
              </p>
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={readAll}
                disabled={readAllMutation.isPending}
                className={`shrink-0 disabled:opacity-50 ${PANEL_BUTTON} ${FOCUS_RING}`}
              >
                {readAllMutation.isPending ? '처리 중...' : '모두 읽음'}
              </button>
            )}
          </div>

          <div
            ref={scrollAreaRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {notificationsQuery.isPending ? (
              <NotificationSkeleton />
            ) : notificationsQuery.isError && !notificationsQuery.data ? (
              <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
                <img src={MASCOTS.surprised} alt="" className="size-12 object-contain [image-rendering:pixelated]" />
                <p className="mt-3 text-body-04 font-bold text-text-strong">알림을 불러오지 못했어요</p>
                <button
                  type="button"
                  onClick={() => void notificationsQuery.refetch()}
                  className={`mt-4 ${PANEL_BUTTON} ${FOCUS_RING}`}
                >
                  <ArrowPathIcon aria-hidden="true" className="size-4" />
                  다시 시도
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-9 text-center">
                <img src={MASCOTS.basket} alt="" className="size-14 object-contain [image-rendering:pixelated]" />
                <p className="mt-3 text-body-04 font-bold text-text-strong">아직 도착한 알림이 없어요</p>
                <p className="mt-1 text-xs text-text-muted">거래와 친구 소식이 생기면 여기에 알려드릴게요.</p>
              </div>
            ) : (
              <ul aria-label="최근 알림" className="space-y-2 p-3">
                {notifications.map((notification) => (
                  <NotificationRow
                    key={notification.notificationId}
                    notification={notification}
                    reading={readingIds.includes(notification.notificationId)}
                    onSelect={selectNotification}
                    onRead={markAsRead}
                  />
                ))}
                {hasNextPage && (
                  <li ref={loadMoreRef} className="flex min-h-12 items-center justify-center px-4 py-2 text-xs text-text-muted">
                    {isFetchNextPageError ? (
                      <button
                        type="button"
                        onClick={() => void fetchNextPage()}
                        className={`${PANEL_BUTTON} ${FOCUS_RING}`}
                      >
                        <ArrowPathIcon aria-hidden="true" className="size-4" />
                        알림 더 불러오기
                      </button>
                    ) : isFetchingNextPage ? (
                      <span role="status" className="flex items-center gap-2">
                        <ArrowPathIcon aria-hidden="true" className="size-4 motion-safe:animate-spin" />
                        이전 알림을 불러오는 중...
                      </span>
                    ) : (
                      <span className="sr-only">이전 알림을 불러올 준비가 됐어요</span>
                    )}
                  </li>
                )}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
