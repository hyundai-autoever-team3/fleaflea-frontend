import { Link } from 'react-router'

import { previewContent, useChatRooms, type ChatRoom } from '../../../entities/chat'
import { MASCOTS } from '../../../shared/config/mascots'
import { Avatar } from '../../../shared/ui/avatar'

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'

// 오늘 온 메시지는 시각, 올해 것은 월·일, 그보다 오래된 것은 연도까지 보여 준다
function lastMessageTime(value: string | null) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  if (date.toDateString() === now.toDateString())
    return new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' }).format(date)

  return new Intl.DateTimeFormat('ko-KR', {
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function RoomRow({ room, active }: { room: ChatRoom; active: boolean }) {
  const preview = room.lastMessageContent
    ? previewContent(room.lastMessageContent)
    : '아직 나눈 대화가 없어요'

  return (
    <li>
      <Link
        to={`/chat/${room.id}`}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${FOCUS_RING} ${active ? 'bg-primary-subtle' : 'hover:bg-primary-subtle/60'}`}
      >
        <Avatar profileImageUrl={room.profileImageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="min-w-0 flex-1 truncate text-body-03 font-bold text-text-strong">
              {room.nickname}
            </p>
            <span className="shrink-0 text-xs text-text-muted">
              {lastMessageTime(room.lastMessageAt)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={`min-w-0 flex-1 truncate text-body-04 ${room.unreadCount > 0 ? 'font-bold text-text-strong' : 'text-text-muted'}`}
            >
              {preview}
            </p>
            {room.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                <span className="sr-only">안 읽은 메시지 </span>
                {room.unreadCount > 99 ? '99+' : room.unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

export function ChatRoomList({ activeRoomId }: { activeRoomId: number | null }) {
  const roomsQuery = useChatRooms()

  if (roomsQuery.isPending)
    return (
      <div role="status" aria-label="채팅 목록을 불러오는 중이에요" className="px-4 py-3">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            aria-hidden="true"
            className="flex items-center gap-3 py-3 motion-safe:animate-pulse"
          >
            <div className="size-12 shrink-0 bg-primary-subtle" />
            <div className="flex-1">
              <div className="h-4 w-1/3 bg-primary-subtle" />
              <div className="mt-2 h-3 w-2/3 bg-primary-subtle" />
            </div>
          </div>
        ))}
      </div>
    )

  if (roomsQuery.isError)
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <p role="alert" className="text-body-03 font-bold text-text-strong">
          채팅 목록을 불러오지 못했어요
        </p>
        <button
          type="button"
          onClick={() => void roomsQuery.refetch()}
          disabled={roomsQuery.isFetching}
          className={`mt-4 min-h-11 rounded-lg bg-primary-tint px-5 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary disabled:opacity-50 ${FOCUS_RING}`}
        >
          {roomsQuery.isFetching ? '다시 불러오는 중...' : '다시 시도'}
        </button>
      </div>
    )

  if (roomsQuery.data.length === 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <img
          draggable={false}
          src={MASCOTS.basket}
          alt=""
          className="h-20 object-contain [image-rendering:pixelated]"
        />
        <p className="mt-4 text-body-03 font-bold text-text-strong">아직 채팅방이 없어요</p>
        <p className="mt-1 text-body-04 text-text-muted">친구 목록에서 채팅을 시작할 수 있어요.</p>
        <Link
          to="/friends"
          viewTransition
          className={`mt-5 flex min-h-11 items-center rounded-lg bg-primary-tint px-5 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary ${FOCUS_RING}`}
        >
          친구 보러 가기
        </Link>
      </div>
    )

  // 고른 방은 판 끝까지 띠로 칠하지 않고, 안쪽에 둥근 칸으로 띄워 표시한다
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
      {roomsQuery.data.map((room) => (
        <RoomRow key={room.id} room={room} active={room.id === activeRoomId} />
      ))}
    </ul>
  )
}
