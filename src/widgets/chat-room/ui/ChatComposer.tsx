import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { FaceSmileIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'

import { STICKERS, toStickerContent } from '../../../entities/chat'
import { sendChatMessage, sendChatTyping, useChatStore } from '../../../features/chat'

const MAX_LENGTH = 2000
// 입력하는 동안 "입력 중" 신호는 1초에 한 번만 다시 보낸다
const TYPING_INTERVAL = 1_000
const MAX_INPUT_HEIGHT = 120

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

export function ChatComposer({
  roomId,
  canSend,
  onSent,
}: {
  roomId: number
  canSend: boolean
  // 보낸 뒤 대화를 맨 아래로 내릴 때 쓴다
  onSent: () => void
}) {
  const connected = useChatStore((state) => state.status === 'connected')
  const status = useChatStore((state) => state.status)
  const [text, setText] = useState('')
  const [stickerOpen, setStickerOpen] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const stickerRef = useRef<HTMLDivElement>(null)
  // 마지막으로 "입력 중"을 보낸 시각(입력 이벤트의 timeStamp). 0이면 지금 입력 중이 아니라고 알려 둔 상태다
  const typingSentAtRef = useRef(0)

  function stopTyping() {
    if (typingSentAtRef.current === 0) return

    typingSentAtRef.current = 0
    sendChatTyping(roomId, false)
  }

  // 방을 나가면 입력 중 표시를 내린다
  useEffect(() => {
    return () => {
      if (typingSentAtRef.current !== 0) sendChatTyping(roomId, false)
    }
  }, [roomId])

  // 스티커 창은 바깥을 누르거나 ESC를 누르면 닫는다
  useEffect(() => {
    if (!stickerOpen) return

    function closeOnOutside(event: PointerEvent) {
      if (!stickerRef.current?.contains(event.target as Node)) setStickerOpen(false)
    }
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setStickerOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [stickerOpen])

  function resize() {
    const input = inputRef.current
    if (!input) return

    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }

  function handleChange(value: string, now: number) {
    setText(value)
    resize()

    if (value.trim() === '') {
      stopTyping()
      return
    }

    if (typingSentAtRef.current === 0 || now - typingSentAtRef.current >= TYPING_INTERVAL) {
      typingSentAtRef.current = now
      sendChatTyping(roomId, true)
    }
  }

  function send(content: string) {
    stopTyping()
    sendChatMessage(roomId, content)
    onSent()
  }

  function submit() {
    const content = text.trim()
    if (!content || !connected) return

    send(content)
    setText('')
    // 글자를 비운 뒤의 높이로 다시 맞춘다
    requestAnimationFrame(resize)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글은 조합 중에 Enter를 누르면 글자 확정이 먼저 일어난다. 그 Enter로는 보내지 않는다
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return

    event.preventDefault()
    submit()
  }

  if (!canSend)
    return (
      <p className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 text-center text-body-04 text-text-muted">
        지금은 친구가 아니라서 메시지를 보낼 수 없어요.
      </p>
    )

  return (
    // 바탕이나 선이 있는 막대 없이 알약만 띄운다. 아래 여백에는 아이폰 홈 막대만큼의 안전 영역을 더한다
    <div className="relative px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-1 md:px-4 md:pb-4">
      {!connected && (
        <p role="status" className="mb-2 text-center text-xs text-text-muted">
          {status === 'reconnecting'
            ? '연결이 끊겨 다시 연결하고 있어요.'
            : '채팅 서버에 연결하고 있어요.'}
        </p>
      )}

      {/* 스티커·입력칸·보내기를 흰 알약 하나에 담는다. 입력칸에는 테두리를 따로 두지 않고,
          글자를 쓰는 동안에는 알약 전체에 테를 둘러 어디에 입력 중인지 알린다 */}
      <div className="flex items-end gap-1 rounded-[28px] bg-bg p-1.5 shadow-(--shadow-chat-bar) focus-within:ring-2 focus-within:ring-primary/50">
        <div ref={stickerRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setStickerOpen((open) => !open)}
            disabled={!connected}
            aria-label="스티커"
            aria-expanded={stickerOpen}
            className={`flex size-11 items-center justify-center rounded-full bg-primary-subtle text-(--purple-700) transition-colors hover:bg-primary-tint disabled:opacity-40 ${FOCUS_RING}`}
          >
            <FaceSmileIcon className="size-6" />
          </button>

          {stickerOpen && (
            <div
              role="group"
              aria-label="스티커 고르기"
              className="glass-panel absolute bottom-full left-0 z-10 mb-3 grid w-64 grid-cols-4 gap-1 rounded-2xl p-2"
            >
              {STICKERS.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => {
                    send(toStickerContent(sticker.id))
                    setStickerOpen(false)
                  }}
                  aria-label={`${sticker.label} 스티커 보내기`}
                  className={`flex aspect-square items-center justify-center rounded-xl transition-colors hover:bg-white/70 ${FOCUS_RING}`}
                >
                  <img
                    draggable={false}
                    src={sticker.src}
                    alt=""
                    className="size-11 object-contain [image-rendering:pixelated]"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 글자 크기를 16px로 둬야 아이폰에서 입력할 때 화면이 확대되지 않는다 */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(event) => handleChange(event.target.value, event.timeStamp)}
          onKeyDown={handleKeyDown}
          onBlur={stopTyping}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="메시지를 입력해 주세요"
          aria-label="메시지"
          className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-body-03 text-text-strong outline-none [scrollbar-width:none] placeholder:text-text-muted [&::-webkit-scrollbar]:hidden"
        />

        <button
          type="button"
          onClick={submit}
          disabled={!connected || text.trim() === ''}
          aria-label="보내기"
          className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40 ${FOCUS_RING}`}
        >
          <PaperAirplaneIcon className="size-5" />
        </button>
      </div>
    </div>
  )
}
