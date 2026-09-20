import { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  BellIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HandRaisedIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router'

import {
  type NotificationItem,
  type NotificationReferenceType,
  type NotificationType,
  useNotifications,
  useUnreadNotificationCount,
} from '../../../entities/notification'
import {
  getNotificationActionErrorMessage,
  useDeleteNotification,
  useReadAllNotifications,
  useReadNotification,
} from '../../../features/notification-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { useToastStore } from '../../../shared/ui/toast'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const PANEL_BUTTON = 'flex min-h-9 items-center gap-1.5 rounded-lg bg-glass-strong px-3 text-body-04 font-bold text-glass-ink/92 transition-colors hover:bg-bg disabled:opacity-50'
const ROW_ICON_BUTTON = 'grid size-8 place-items-center rounded-lg text-glass-ink/58 transition-colors hover:bg-glass-strong hover:text-glass-ink/92 disabled:opacity-50'

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
  busy,
  onSelect,
  onRead,
  onDelete,
}: {
  notification: NotificationItem
  busy: boolean
  onSelect: (notification: NotificationItem) => void
  onRead: (notification: NotificationItem) => void
  onDelete: (notification: NotificationItem) => void
}) {
  const unread = !notification.isRead
  const typeStyle = TYPE_STYLE[notification.type]

  return (
    // 읽음 여부는 유리면의 투명도와 픽셀 체크로 드러낸다.
    // 읽은 줄은 지우지 않고 가라앉히되, 종류 라벨의 색은 그대로 둔다
    <li
      aria-busy={busy}
      className={`relative flex min-h-[3.75rem] items-start gap-2.5 rounded-xl px-2.5 py-2 transition-colors ${
        unread ? 'bg-glass-strong' : 'bg-glass'
      }`}
    >
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-subtle ${
          unread ? 'text-glass-ink/92' : 'text-glass-ink/58'
        }`}
      >
        <NotificationIcon type={notification.type} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${typeStyle.textClass}`}>{typeStyle.label}</span>
          <time
            dateTime={notification.createdAt}
            title={fullDate(notification.createdAt)}
            className="ml-auto shrink-0 text-[11px] text-glass-ink/58"
          >
            {relativeTime(notification.createdAt)}
          </time>
        </div>

        {/* 줄 어디를 눌러도 관련 화면으로 넘어가게 넓히되, 옆의 버튼은 z-10으로 위에 띄운다 */}
        <button
          type="button"
          onClick={() => onSelect(notification)}
          className={`mt-1 block w-full break-keep text-left text-body-04 leading-5 after:absolute after:inset-0 after:content-[''] ${
            unread ? 'font-bold text-glass-ink/92' : 'text-glass-ink/58'
          } ${FOCUS_RING}`}
        >
          {notification.message}
        </button>
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-1">
        {/* 읽음 표시는 눌러서 체크하는 칸으로 둔다. 읽고 나면 체크가 찍혀 그대로 남아
            어느 알림을 봤는지 한눈에 들어온다 (읽지 않음으로 되돌리는 API는 없다) */}
        <button
          type="button"
          onClick={() => onRead(notification)}
          disabled={!unread || busy}
          aria-pressed={!unread}
          title={unread ? '읽음으로 표시' : '읽은 알림'}
          aria-label={unread ? `${typeStyle.label} 알림을 읽음으로 표시` : `${typeStyle.label} 알림, 읽음`}
          style={{ clipPath: pixelBox(2) }}
          className={`grid size-6 place-items-center transition-colors disabled:cursor-default disabled:opacity-100 ${
            unread
              // 빈 칸이지만 테두리와 옅은 체크로 '누르면 체크된다'를 먼저 보여준다
              ? 'bg-bg text-primary/25 ring-1 ring-inset ring-primary hover:text-primary/60'
              : 'bg-primary text-white ring-1 ring-inset ring-primary'
          } ${FOCUS_RING}`}
        >
          <Sprite rows={GLYPHS.check} className="w-3" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(notification)}
          disabled={busy}
          title="알림 삭제"
          aria-label={`${typeStyle.label} 알림 삭제`}
          className={`${ROW_ICON_BUTTON} hover:text-status-danger ${FOCUS_RING}`}
        >
          <TrashIcon aria-hidden="true" className="size-4" />
        </button>
      </div>
    </li>
  )
}

function NotificationSkeleton() {
  return (
    <div role="status" aria-label="알림을 불러오는 중" className="space-y-2.5 px-3 pb-3 pt-1">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex min-h-[3.75rem] items-start gap-2.5 rounded-xl bg-glass px-2.5 py-2 motion-safe:animate-pulse">
          <span className="size-8 shrink-0 rounded-lg bg-primary-subtle" />
          <span className="mt-1 h-10 flex-1 rounded-lg bg-glass" />
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
  const [page, setPage] = useState(0)
  const [busyIds, setBusyIds] = useState<number[]>([])
  const notificationsQuery = useNotifications({ page, enabled: open })
  const unreadCountQuery = useUnreadNotificationCount()
  const readNotificationMutation = useReadNotification()
  const readAllMutation = useReadAllNotifications()
  const deleteMutation = useDeleteNotification()

  const notifications = notificationsQuery.data?.content ?? []
  const totalPages = Math.max(1, notificationsQuery.data?.totalPages ?? 1)
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

  function togglePanel() {
    const nextOpen = !open
    onOpenChange(nextOpen)
    // 다시 열 때는 늘 첫 장부터 — 지난번에 보던 장은 이미 낡았다
    if (nextOpen) {
      setPage(0)
      void unreadCountQuery.refetch()
    }
  }

  function showMutationError(error: unknown) {
    useToastStore.getState().showToast(getNotificationActionErrorMessage(error))
  }

  // 알림마다 따로 눌리므로, 어느 줄이 처리 중인지도 줄 단위로 기억한다
  function runOnNotification(
    notificationId: number,
    run: (id: number, options: { onError: (error: unknown) => void; onSettled: () => void }) => void,
  ) {
    if (busyIds.includes(notificationId)) return
    setBusyIds((current) => [...current, notificationId])
    run(notificationId, {
      onError: showMutationError,
      onSettled: () => setBusyIds((current) => current.filter((id) => id !== notificationId)),
    })
  }

  function markAsRead(notification: NotificationItem) {
    runOnNotification(notification.notificationId, (id, options) => readNotificationMutation.mutate(id, options))
  }

  function removeNotification(notification: NotificationItem) {
    // 마지막 장의 마지막 줄을 지우면 빈 장만 남으므로 앞 장으로 물러난다
    if (notifications.length === 1 && page > 0) setPage(page - 1)
    runOnNotification(notification.notificationId, (id, options) => deleteMutation.mutate(id, options))
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
        // (프로필 메뉴·거래 출처 목록과 같은 예외 — design.md 1장).
        // 판 안에서 스크롤하지 않도록 한 장에 다섯 줄만 그리고 나머지는 페이지로 넘긴다.
        // max-h는 화면이 아주 낮을 때만 도는 안전장치다
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          aria-busy={notificationsQuery.isPending}
          className="glass-panel fixed inset-x-4 top-[6.75rem] z-50 max-h-[calc(100dvh-7.75rem)] overflow-y-auto overscroll-contain rounded-2xl [scrollbar-width:none] md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[calc(100dvh-5rem)] md:w-96 [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-body-03 font-bold text-glass-ink/92">알림</h2>
              <p className="mt-0.5 text-xs text-glass-ink/58">
                {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '새 소식을 확인해 보세요'}
              </p>
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={readAll}
                disabled={readAllMutation.isPending}
                className={`shrink-0 ${PANEL_BUTTON} ${FOCUS_RING}`}
              >
                {readAllMutation.isPending ? '처리 중...' : '모두 읽음'}
              </button>
            )}
          </div>

          {notificationsQuery.isPending ? (
            <NotificationSkeleton />
          ) : notificationsQuery.isError && !notificationsQuery.data ? (
            <div role="alert" className="flex flex-col items-center px-6 py-10 text-center">
              <img src={MASCOTS.surprised} alt="" className="size-12 object-contain [image-rendering:pixelated]" />
              <p className="mt-3 text-body-04 font-bold text-glass-ink/92">알림을 불러오지 못했어요</p>
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
              <p className="mt-3 break-keep text-body-04 font-bold text-glass-ink/92">아직 도착한 알림이 없어요</p>
              <p className="mt-1 max-w-56 text-balance text-xs text-glass-ink/58">거래와 친구 소식이 생기면 여기에 알려드릴게요.</p>
            </div>
          ) : (
            <ul aria-label="최근 알림" className="space-y-2.5 px-3 pb-3 pt-1">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.notificationId}
                  notification={notification}
                  busy={busyIds.includes(notification.notificationId)}
                  onSelect={selectNotification}
                  onRead={markAsRead}
                  onDelete={removeNotification}
                />
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav aria-label="알림 페이지" className="flex items-center justify-between gap-2 border-t border-glass-line px-3 py-2.5">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0 || notificationsQuery.isFetching}
                aria-label="최근 알림으로"
                className={`${ROW_ICON_BUTTON} ${FOCUS_RING}`}
              >
                <ChevronLeftIcon aria-hidden="true" className="size-4" />
              </button>
              <span aria-live="polite" className="text-[11px] text-glass-ink/58">
                {page + 1} / {totalPages}
                {notificationsQuery.data?.totalElements
                  ? ` · 전체 ${notificationsQuery.data.totalElements}개`
                  : ''}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={!notificationsQuery.data?.hasNext || notificationsQuery.isFetching}
                aria-label="지난 알림으로"
                className={`${ROW_ICON_BUTTON} ${FOCUS_RING}`}
              >
                <ChevronRightIcon aria-hidden="true" className="size-4" />
              </button>
            </nav>
          )}
        </section>
      )}
    </div>
  )
}
