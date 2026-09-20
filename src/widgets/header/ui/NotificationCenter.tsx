import { useEffect, useId, useMemo, useRef } from 'react'
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
import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { useToastStore } from '../../../shared/ui/toast'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const PANEL_BUTTON = 'flex min-h-9 items-center gap-1.5 bg-bg px-3 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary-tint'

interface NotificationTypeStyle {
  label: string
  glyph: readonly string[]
  tileClass: string
  textClass: string
}

// 종류별 색은 tokens.css의 status 토큰만 쓴다 (design.md 9장 — 컴포넌트에 hex 금지)
const TYPE_STYLE: Record<NotificationType, NotificationTypeStyle> = {
  TRADE_REQUESTED: {
    label: '거래 요청',
    glyph: GLYPHS.swap,
    tileClass: 'bg-primary-tint text-status-brand',
    textClass: 'text-status-brand',
  },
  TRADE_ACCEPTED: {
    label: '요청 수락',
    glyph: GLYPHS.check,
    tileClass: 'bg-status-success-subtle text-status-success',
    textClass: 'text-status-success',
  },
  TRADE_REJECTED: {
    label: '요청 거절',
    glyph: GLYPHS.cross,
    tileClass: 'bg-status-danger-subtle text-status-danger',
    textClass: 'text-status-danger',
  },
  TRADE_CANCELLED: {
    label: '요청 취소',
    glyph: GLYPHS.undo,
    tileClass: 'bg-bg-subtle text-text-muted',
    textClass: 'text-text-muted',
  },
  TRADE_COMPLETED: {
    label: '거래 완료',
    glyph: GLYPHS.parcel,
    tileClass: 'bg-status-success-subtle text-status-success',
    textClass: 'text-status-success',
  },
  FRIEND_REQUESTED: {
    label: '친구 요청',
    glyph: GLYPHS.personPlus,
    tileClass: 'bg-status-info-subtle text-status-info',
    textClass: 'text-status-info',
  },
  FRIEND_ACCEPTED: {
    label: '친구 수락',
    glyph: GLYPHS.friends,
    tileClass: 'bg-status-success-subtle text-status-success',
    textClass: 'text-status-success',
  },
  POKE_RECEIVED: {
    label: '콕찌르기',
    glyph: GLYPHS.hand,
    tileClass: 'bg-status-warning-subtle text-status-warning',
    textClass: 'text-status-warning',
  },
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
  onSelect,
}: {
  notification: NotificationItem
  onSelect: (notification: NotificationItem) => void
}) {
  const unread = !notification.isRead
  const typeStyle = TYPE_STYLE[notification.type]

  return (
    // 읽은 알림은 지우지 않고 색을 죽여 가라앉힌다 (design.md 1장 4번)
    <li
      style={{ clipPath: pixelBox(3) }}
      className={`relative flex items-start gap-2.5 p-2.5 transition-colors ${unread ? 'bg-bg' : 'bg-bg/55'}`}
    >
      <span
        style={{ clipPath: pixelBox(2) }}
        className={`mt-0.5 grid size-9 shrink-0 place-items-center ${unread ? typeStyle.tileClass : 'bg-bg-subtle text-text-muted'}`}
      >
        <Sprite rows={typeStyle.glyph} className="w-4" />
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

        {/* 줄 어디를 눌러도 관련 화면으로 넘어가게 넓힌다 */}
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

    </li>
  )
}

function NotificationSkeleton() {
  return (
    <div role="status" aria-label="알림을 불러오는 중" className="space-y-2 p-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          style={{ clipPath: pixelBox(3) }}
          className="flex items-start gap-2.5 bg-bg/55 p-2.5 motion-safe:animate-pulse"
        >
          <span style={{ clipPath: pixelBox(2) }} className="size-9 shrink-0 bg-primary-tint" />
          <span className="mt-1 h-10 flex-1 bg-primary-subtle" />
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

  function selectNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      readNotificationMutation.mutate(notification.notificationId, { onError: showMutationError })
    }
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
        <Sprite rows={GLYPHS.bell} className="w-5" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{ clipPath: pixelBox(2) }}
            className="absolute right-0 top-0.5 min-w-5 bg-status-danger px-1 py-0.5 text-[10px] font-bold leading-3 text-white"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        // 그림자는 clip-path가 잘라내지 못하도록 바깥 래퍼에 필터로 건다 (design.md 4장 폴라로이드)
        <div className="fixed inset-x-4 top-[6.75rem] z-50 drop-shadow-[0_10px_24px_rgba(20,24,29,0.18)] md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96">
          {/* 픽셀 테두리 2겹 — 바깥 연보라 판, 안쪽 반투명 연보라 면 */}
          <section
            id={panelId}
            role="dialog"
            aria-labelledby={titleId}
            aria-busy={notificationsQuery.isPending || isFetchingNextPage}
            style={{ clipPath: pixelBox(6) }}
            className="flex max-h-[calc(100dvh-7.75rem)] flex-col bg-primary-tint/75 p-[2px] backdrop-blur-md md:max-h-[calc(100dvh-5rem)]"
          >
            <div
              style={{ clipPath: pixelBox(6) }}
              className="flex min-h-0 flex-1 flex-col bg-primary-subtle/85"
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
                    style={{ clipPath: pixelBox(3) }}
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
                    <img
                      src={MASCOTS.surprised}
                      alt=""
                      className="size-12 object-contain [image-rendering:pixelated]"
                    />
                    <p className="mt-3 text-body-04 font-bold text-text-strong">알림을 불러오지 못했어요</p>
                    <button
                      type="button"
                      onClick={() => void notificationsQuery.refetch()}
                      style={{ clipPath: pixelBox(3) }}
                      className={`mt-4 ${PANEL_BUTTON} ${FOCUS_RING}`}
                    >
                      다시 시도 <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-9 text-center">
                    <img
                      src={MASCOTS.basket}
                      alt=""
                      className="size-14 object-contain [image-rendering:pixelated]"
                    />
                    <p className="mt-3 text-body-04 font-bold text-text-strong">아직 도착한 알림이 없어요</p>
                    <p className="mt-1 text-xs text-text-muted">거래와 친구 소식이 생기면 여기에 알려드릴게요.</p>
                  </div>
                ) : (
                  <ul aria-label="최근 알림" className="space-y-2 p-3">
                    {notifications.map((notification) => (
                      <NotificationRow
                        key={notification.notificationId}
                        notification={notification}
                        onSelect={selectNotification}
                      />
                    ))}
                    {hasNextPage && (
                      <li ref={loadMoreRef} className="flex min-h-12 items-center justify-center px-4 py-2 text-xs text-text-muted">
                        {isFetchNextPageError ? (
                          <button
                            type="button"
                            onClick={() => void fetchNextPage()}
                            style={{ clipPath: pixelBox(3) }}
                            className={`${PANEL_BUTTON} ${FOCUS_RING}`}
                          >
                            알림 더 불러오기 <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                          </button>
                        ) : isFetchingNextPage ? (
                          <span role="status">이전 알림을 불러오는 중...</span>
                        ) : (
                          <span className="sr-only">이전 알림을 불러올 준비가 됐어요</span>
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
