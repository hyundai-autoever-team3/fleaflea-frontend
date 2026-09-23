import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
  BellAlertIcon,
  BellIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  CheckIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
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
  useDeleteAllNotifications,
  useDeleteNotification,
  useReadAllNotifications,
  useReadNotification,
} from '../../../features/notification-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { useToastStore } from '../../../shared/ui/toast'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const PANEL_BUTTON = 'flex min-h-9 items-center gap-1.5 rounded-lg bg-glass-strong px-3 text-body-04 font-bold text-glass-ink/92 transition-colors hover:bg-bg disabled:opacity-50'
const ROW_ICON_BUTTON = 'grid size-8 place-items-center rounded-lg text-glass-ink/58 transition-colors hover:bg-glass-strong hover:text-glass-ink/92 disabled:opacity-50'

interface NotificationTypeStyle {
  label: string
  textClass: string
  tileClass: string
}

// 종류는 아이콘 타일의 색이 먼저 알려주고, 라벨 한 단어가 이름을 붙인다.
// 타일은 흰 아이콘이 읽히는 중간 파스텔, 라벨 글자는 작아서 짙은 톤을 쓴다.
// 색 값은 tokens.css의 status 토큰만 쓴다 (design.md 9장 — 컴포넌트에 hex 금지)
const TYPE_STYLE: Record<NotificationType, NotificationTypeStyle> = {
  TRADE_REQUESTED: { label: '교환', textClass: 'text-status-brand', tileClass: 'bg-status-brand-tile' },
  TRADE_ACCEPTED: { label: '수락', textClass: 'text-status-info', tileClass: 'bg-status-info-tile' },
  TRADE_REJECTED: { label: '거절', textClass: 'text-status-danger', tileClass: 'bg-status-danger-tile' },
  TRADE_CANCELLED: { label: '취소', textClass: 'text-text-muted', tileClass: 'bg-status-muted-tile' },
  TRADE_COMPLETED: { label: '완료', textClass: 'text-status-success', tileClass: 'bg-status-success-tile' },
  FRIEND_REQUESTED: { label: '친구 요청', textClass: 'text-status-accent', tileClass: 'bg-status-accent-tile' },
  FRIEND_ACCEPTED: { label: '친구 수락', textClass: 'text-status-info', tileClass: 'bg-status-info-tile' },
  POKE_RECEIVED: { label: '콕 찌르기', textClass: 'text-status-nudge', tileClass: 'bg-status-nudge-tile' },
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
      return <BellAlertIcon aria-hidden="true" className={className} />
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
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-white ${typeStyle.tileClass} ${
          unread ? '' : 'opacity-55'
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
          className={`mt-1 block w-full break-keep text-left text-xs leading-5 after:absolute after:inset-0 after:content-[''] ${
            unread ? 'font-medium text-glass-ink/85' : 'font-normal text-glass-ink/62'
          } ${FOCUS_RING}`}
        >
          {notification.message}
        </button>
      </div>

      <div className="relative z-10 -mr-1 flex shrink-0 items-center">
        {/* 읽음 표시는 눌러서 체크하는 칸으로 둔다. 읽고 나면 체크가 찍혀 그대로 남아
            어느 알림을 봤는지 한눈에 들어온다 (읽지 않음으로 되돌리는 API는 없다) */}
        <button
          type="button"
          onClick={() => onRead(notification)}
          disabled={!unread || busy}
          aria-pressed={!unread}
          title={unread ? '읽음으로 표시' : '읽은 알림'}
          aria-label={unread ? `${typeStyle.label} 알림을 읽음으로 표시` : `${typeStyle.label} 알림, 읽음`}
          className={`${ROW_ICON_BUTTON} disabled:cursor-default disabled:opacity-100 ${
            unread ? 'hover:text-primary' : 'text-primary'
          } ${FOCUS_RING}`}
        >
          {/* 읽고 나면 속이 찬 동그라미가 남아, 훑을 때 본 것과 안 본 것이 갈린다 */}
          {unread
            ? <CheckIcon aria-hidden="true" className="size-4" />
            : <CheckCircleSolidIcon aria-hidden="true" className="size-4" />}
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLLIElement>(null)
  const [busyIds, setBusyIds] = useState<number[]>([])
  const notificationsQuery = useInfiniteNotifications({ enabled: open })
  const unreadCountQuery = useUnreadNotificationCount()
  const readNotificationMutation = useReadNotification()
  const readAllMutation = useReadAllNotifications()
  const deleteMutation = useDeleteNotification()
  const deleteAllMutation = useDeleteAllNotifications()
  // 되돌릴 수 없는 동작이라 한 번 더 묻는다. 판 안에 모달을 겹치면 무거워
  // 제목 줄을 확인 문구로 바꿔 그 자리에서 답하게 한다
  const [confirmingClear, setConfirmingClear] = useState(false)

  const {
    data: notificationPages,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
  } = notificationsQuery

  // 같은 알림이 두 쪽에 걸쳐 오면 키가 겹치므로 한 번만 남긴다
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

  // 바닥이 보이면 다음 쪽을 이어 받는다
  useEffect(() => {
    const target = loadMoreRef.current
    const root = scrollAreaRef.current
    if (!open || !target || !root || !hasNextPage || isFetchNextPageError) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { root, rootMargin: '96px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetchingNextPage, open])

  function togglePanel() {
    const nextOpen = !open
    onOpenChange(nextOpen)
    if (nextOpen) void unreadCountQuery.refetch()
    // 닫았다 열면 확인 상태는 없던 일로 한다
    setConfirmingClear(false)
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
    runOnNotification(notification.notificationId, (id, options) => deleteMutation.mutate(id, options))
  }

  function selectNotification(notification: NotificationItem) {
    if (!notification.isRead) markAsRead(notification)
    onOpenChange(false)
    void navigate(DESTINATION[notification.referenceType], { viewTransition: true })
  }

  function clearAll() {
    if (deleteAllMutation.isPending) return
    deleteAllMutation.mutate(undefined, {
      onSuccess: () => {
        setConfirmingClear(false)
        triggerRef.current?.focus()
      },
      onError: showMutationError,
    })
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
        <BellIcon aria-hidden="true" className="size-7" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-badge-danger px-1 text-[10px] font-bold leading-none text-white ring-2 ring-bg"
          >
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        // 잠깐 떴다 사라지는 조작용 판이라 픽셀 계단 대신 둥근 모서리를 쓴다
        // (프로필 메뉴·거래 출처 목록과 같은 예외 — design.md 1장).
        // 제목 줄은 고정하고 목록만 스크롤하며 이어 받는다.
        // 스크롤바는 판 안에 드러나지 않게 숨긴다
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          aria-busy={notificationsQuery.isPending}
          className="glass-panel fixed inset-x-4 top-[6.75rem] z-50 flex max-h-[calc(100dvh-7.75rem)] flex-col overflow-hidden rounded-2xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[calc(100dvh-5rem)] md:w-96"
        >
          <div className="flex min-h-[4.5rem] shrink-0 items-center justify-between gap-3 px-4 py-3.5">
            {confirmingClear ? (
              <>
                <div className="min-w-0">
                  <p className="text-body-03 font-bold text-glass-ink/92">알림을 모두 지울까요?</p>
                  <p className="mt-0.5 text-xs text-glass-ink/58">지운 알림은 되돌릴 수 없어요.</p>
                </div>
                {/* 판 안의 다른 동작과 같은 글자 링크로 둔다. 채운 버튼을 하나만
                    세우면 유리면 위에서 혼자 튄다. 지우기는 굵기와 색으로 가른다 */}
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={deleteAllMutation.isPending}
                    className={`whitespace-nowrap text-[11px] font-bold text-status-danger underline underline-offset-2 transition-colors hover:text-glass-ink/92 disabled:no-underline disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    {deleteAllMutation.isPending ? '지우는 중...' : '지우기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    disabled={deleteAllMutation.isPending}
                    className={`whitespace-nowrap text-[11px] text-glass-ink/58 underline-offset-2 transition-colors hover:text-glass-ink/92 hover:underline disabled:opacity-50 ${FOCUS_RING}`}
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="min-w-0">
                  <h2 id={titleId} className="text-body-03 font-bold text-glass-ink/92">알림</h2>
                  <p className="mt-0.5 text-xs text-glass-ink/58">
                    {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '새 소식을 확인해 보세요'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {hasUnread && (
                    <button
                      type="button"
                      onClick={readAll}
                      disabled={readAllMutation.isPending}
                      className={`whitespace-nowrap text-[11px] text-glass-ink/58 underline-offset-2 transition-colors hover:text-glass-ink/92 hover:underline disabled:no-underline disabled:opacity-50 ${FOCUS_RING}`}
                    >
                      {readAllMutation.isPending ? '처리 중...' : '모두 읽음'}
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(true)}
                      className={`whitespace-nowrap text-[11px] text-glass-ink/58 underline-offset-2 transition-colors hover:text-status-danger hover:underline ${FOCUS_RING}`}
                    >
                      전체 삭제
                    </button>
                  )}
                </div>
              </>
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
              <img draggable={false} src={MASCOTS.surprised} alt="" className="size-12 object-contain [image-rendering:pixelated]" />
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
              <img draggable={false} src={MASCOTS.basket} alt="" className="size-14 object-contain [image-rendering:pixelated]" />
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
              {hasNextPage && (
                <li ref={loadMoreRef} className="flex min-h-10 items-center justify-center px-4 py-2 text-xs text-glass-ink/58">
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
