import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

import {
  parseSticker,
  useChatMessages,
  useChatRoom,
  type ChatMessage,
  type ChatRoom,
} from '../../../entities/chat'
import {
  discardChatMessage,
  markChatRoomRead,
  retryChatMessage,
  useChatStore,
  type PendingMessage,
} from '../../../features/chat'
import { MASCOTS } from '../../../shared/config/mascots'
import { Avatar } from '../../../shared/ui/avatar'
import { ChatComposer } from './ChatComposer'

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

const timeFormat = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})

function toDate(value: string) {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function sameDay(a: string, b: string) {
  return toDate(a)?.toDateString() === toDate(b)?.toDateString()
}

// 같은 사람이 같은 분에 이어 보낸 메시지는 한 묶음으로 보고 시각과 프로필을 한 번만 붙인다
function sameGroup(a: ChatMessage, b: ChatMessage) {
  const first = toDate(a.createdAt)
  const second = toDate(b.createdAt)
  if (a.senderId !== b.senderId || !first || !second) return false

  return Math.floor(first.getTime() / 60_000) === Math.floor(second.getTime() / 60_000)
}

// 스티커는 말풍선 없이 그림만, 글자는 유리 말풍선에 담는다.
// tail: 말풍선 꼬리를 붙일지. 이어 보낸 메시지 묶음에서는 마지막 하나에만 붙인다
function MessageBody({
  content,
  mine,
  tail = true,
}: {
  content: string
  mine: boolean
  tail?: boolean
}) {
  const sticker = parseSticker(content)

  if (sticker && sticker !== 'unknown')
    return (
      <img
        draggable={false}
        src={sticker.src}
        alt={`${sticker.label} 스티커`}
        className="size-24 object-contain [image-rendering:pixelated]"
      />
    )

  return (
    <p
      className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-body-04 leading-relaxed text-text-strong md:max-w-[62%] ${
        mine ? 'glass-bubble-mine rounded-br-md' : 'glass-bubble rounded-bl-md'
      } ${tail ? (mine ? 'bubble-tail-mine' : 'bubble-tail') : ''}`}
    >
      {sticker === 'unknown' ? '스티커' : content}
    </p>
  )
}

function MessageRow({
  message,
  room,
  showAvatar,
  showTime,
  read,
}: {
  message: ChatMessage
  room: ChatRoom
  showAvatar: boolean
  showTime: boolean
  read: boolean
}) {
  const mine = message.senderId !== room.friendId
  const date = toDate(message.createdAt)
  const meta = (
    <span className="flex shrink-0 flex-col text-[11px] leading-tight text-text-muted">
      {read && <span className={mine ? 'text-right' : ''}>읽음</span>}
      {showTime && date && <time dateTime={message.createdAt}>{timeFormat.format(date)}</time>}
    </span>
  )

  if (mine)
    return (
      <li className="flex items-end justify-end gap-1.5">
        {meta}
        <MessageBody content={message.content} mine tail={showTime} />
      </li>
    )

  return (
    <li className="flex items-end gap-1.5">
      {/* 묶음의 첫 메시지에만 프로필을 두고, 나머지는 같은 너비를 비워 줄을 맞춘다 */}
      <span className="w-8 shrink-0 self-start">
        {showAvatar && <Avatar profileImageUrl={room.profileImageUrl} size="sm" />}
      </span>
      <MessageBody content={message.content} mine={false} tail={showTime} />
      {meta}
    </li>
  )
}

function PendingRow({ message }: { message: PendingMessage }) {
  const failed = message.status === 'failed'

  return (
    <li className="flex flex-col items-end gap-1">
      <div className={`flex w-full items-end justify-end gap-1.5 ${failed ? '' : 'opacity-60'}`}>
        {!failed && <span className="shrink-0 text-[11px] text-text-muted">보내는 중</span>}
        <MessageBody content={message.content} mine />
      </div>
      {failed && (
        <div className="flex items-center gap-2 text-xs">
          <span role="alert" className="text-red-600">
            보내지 못했어요
          </span>
          <button
            type="button"
            onClick={() => retryChatMessage(message.clientMessageId)}
            className={`font-bold text-text-strong underline underline-offset-2 ${FOCUS_RING}`}
          >
            다시 보내기
          </button>
          <button
            type="button"
            onClick={() => discardChatMessage(message.clientMessageId)}
            className={`text-text-muted underline underline-offset-2 ${FOCUS_RING}`}
          >
            지우기
          </button>
        </div>
      )}
    </li>
  )
}

function TypingRow({ room }: { room: ChatRoom }) {
  return (
    <li className="flex items-end gap-1.5">
      <span className="w-8 shrink-0">
        <Avatar profileImageUrl={room.profileImageUrl} size="sm" />
      </span>
      <span
        role="status"
        className="glass-bubble bubble-tail flex items-center gap-1 rounded-2xl rounded-bl-md px-3.5 py-3"
      >
        <span className="sr-only">{room.nickname}님이 입력하고 있어요</span>
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{ animationDelay: `${index * 150}ms` }}
            className="size-1.5 rounded-full bg-text-muted motion-safe:animate-bounce"
          />
        ))}
      </span>
    </li>
  )
}

function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <img
        draggable={false}
        src={MASCOTS.surprised}
        alt=""
        className="h-20 object-contain [image-rendering:pixelated]"
      />
      <p role="alert" className="mt-4 text-body-03 font-bold text-text-strong">
        {title}
      </p>
      {children}
    </div>
  )
}

export function ChatRoomView({ roomId }: { roomId: number }) {
  const roomQuery = useChatRoom(roomId)
  const messagesQuery = useChatMessages(roomId)
  const connected = useChatStore((state) => state.status === 'connected')
  const typing = useChatStore((state) => state.typingRoomIds.includes(roomId))
  const allPending = useChatStore((state) => state.pending)
  const scrollRef = useRef<HTMLDivElement>(null)
  const olderRef = useRef<HTMLLIElement>(null)

  const room = roomQuery.data
  // 최신 메시지가 앞에 온다
  const messages = messagesQuery.data?.pages.flatMap((page) => page.content) ?? []
  const pending = allPending.filter((message) => message.roomId === roomId)
  const newest = messages[0]
  const isEmpty =
    !messagesQuery.isPending && messages.length === 0 && pending.length === 0 && !typing
  // 내가 보낸 것 가운데 상대가 읽은 가장 최근 메시지 하나에만 "읽음"을 붙인다
  const lastReadMine = room
    ? messages.find(
        (message) => message.senderId !== room.friendId && message.id <= room.friendLastReadId,
      )
    : undefined

  // 이 방을 보고 있다고 알려 둔다. 새 메시지가 와도 안 읽은 수가 오르지 않게 하려는 것이다
  useEffect(() => {
    useChatStore.getState().setActiveRoomId(roomId)

    return () => useChatStore.getState().setActiveRoomId(null)
  }, [roomId])

  // 화면에 보이는 가장 최근 메시지까지 읽었다고 서버에 알린다.
  // 창이 가려져 있으면 보내지 않고, 다시 돌아왔을 때 보낸다
  const newestId = newest?.id
  const newestFromFriend = room !== undefined && newest?.senderId === room.friendId
  const needsRead =
    room !== undefined &&
    newestId !== undefined &&
    (room.unreadCount > 0 || (newestFromFriend && newestId > room.myLastReadId))

  useEffect(() => {
    if (!needsRead || newestId === undefined || !connected) return

    function mark() {
      if (!document.hidden && newestId !== undefined) markChatRoomRead(roomId, newestId)
    }

    mark()
    document.addEventListener('visibilitychange', mark)

    return () => document.removeEventListener('visibilitychange', mark)
  }, [needsRead, newestId, connected, roomId])

  // 맨 위(과거 쪽)에 닿으면 이전 메시지를 더 받는다
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = messagesQuery
  useEffect(() => {
    const target = olderRef.current
    if (!target || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { root: scrollRef.current, rootMargin: '120px 0px 0px 0px' },
    )
    observer.observe(target)

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (roomQuery.isPending)
    return (
      <div role="status" className="flex flex-1 items-center justify-center text-text-muted">
        <span className="text-body-04">대화를 불러오는 중이에요...</span>
      </div>
    )

  if (roomQuery.isError || !room)
    return (
      <Notice title="채팅방을 열 수 없어요">
        <Link
          to="/chat"
          className={`mt-4 flex min-h-11 items-center rounded-lg bg-primary-tint px-5 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary ${FOCUS_RING}`}
        >
          채팅 목록으로
        </Link>
      </Notice>
    )

  return (
    <>
      {/* 머리글·대화·입력창 사이에 선을 긋지 않고 한 판으로 잇는다. 바탕색도 판의 것을 그대로 쓴다 */}
      <header className="flex items-center gap-2 px-2 py-2 md:px-4 md:pt-3">
        <Link
          to="/chat"
          aria-label="채팅 목록으로"
          className={`flex size-11 shrink-0 items-center justify-center text-text-muted hover:text-text-strong md:hidden ${FOCUS_RING}`}
        >
          <ChevronLeftIcon className="size-6" />
        </Link>
        <Avatar profileImageUrl={room.profileImageUrl} size="sm" />
        <h1 className="min-w-0 flex-1 truncate text-body-03 font-bold text-text-strong">
          {room.nickname}
        </h1>
      </header>

      {/* flex-col-reverse: 최신 메시지가 맨 아래에 붙고, 새 메시지가 와도 아래에 머문다.
          위쪽에 과거 메시지를 이어 붙여도 보고 있던 자리가 밀리지 않는다 */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] md:px-5 [&::-webkit-scrollbar]:hidden"
      >
        {messagesQuery.isError ? (
          <Notice title="대화를 불러오지 못했어요">
            <button
              type="button"
              onClick={() => void messagesQuery.refetch()}
              className={`mt-4 min-h-11 rounded-lg bg-bg px-5 text-body-04 font-bold text-text-strong ${FOCUS_RING}`}
            >
              다시 시도
            </button>
          </Notice>
        ) : isEmpty ? (
          // 아직 나눈 대화가 없으면 안내를 대화 영역 한가운데에 둔다
          <div className="m-auto flex flex-col items-center px-6 text-center">
            <img
              draggable={false}
              src={MASCOTS.wink}
              alt=""
              className="h-24 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-5 text-body-02 font-bold text-text-strong">
              처음으로 대화를 시작해 봐요
            </p>
            <p className="mt-1 text-body-04 text-text-muted">
              {room.nickname}님에게 첫 메시지를 보내 보세요.
            </p>
          </div>
        ) : (
          <ul aria-label="대화 내용" className="flex flex-col-reverse gap-1.5">
            {typing && <TypingRow room={room} />}

            {[...pending].reverse().map((message) => (
              <PendingRow key={message.clientMessageId} message={message} />
            ))}

            {messages.map((message, index) => {
              const newer = messages[index - 1]
              const older = messages[index + 1]
              // 날짜가 바뀌는 자리와, 더 받을 과거가 없는 대화의 첫머리에 날짜를 둔다
              const startsDay = older ? !sameDay(message.createdAt, older.createdAt) : !hasNextPage
              const date = toDate(message.createdAt)

              return [
                <MessageRow
                  key={message.id}
                  message={message}
                  room={room}
                  showAvatar={!older || startsDay || !sameGroup(message, older)}
                  showTime={!newer || !sameGroup(message, newer)}
                  read={message.id === lastReadMine?.id}
                />,
                startsDay && date && (
                  <li key={`day-${message.id}`} className="my-3 flex justify-center">
                    <span className="glass-pill rounded-full px-3 py-1 text-xs text-text-muted">
                      {dayFormat.format(date)}
                    </span>
                  </li>
                ),
              ]
            })}

            {messagesQuery.isPending && (
              <li role="status" className="py-6 text-center text-body-04 text-text-muted">
                대화를 불러오는 중이에요...
              </li>
            )}

            {hasNextPage && (
              <li ref={olderRef} className="py-2 text-center text-xs text-text-muted">
                {isFetchingNextPage ? '이전 대화를 불러오는 중이에요...' : ''}
              </li>
            )}
          </ul>
        )}
      </div>

      <ChatComposer
        roomId={roomId}
        canSend={room.canSend}
        onSent={() => scrollRef.current?.scrollTo({ top: 0 })}
      />
    </>
  )
}
