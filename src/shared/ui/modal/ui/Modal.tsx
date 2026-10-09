import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  open: boolean
  onRequestClose: () => void
  labelledBy?: string
  // md: 일반 폼, sm: 프로필·확인, lg: 선택 그리드, compact: 짧은 거래 요청.
  size?: 'md' | 'sm' | 'lg' | 'compact'
  // 내용 안에 별도 닫기 버튼이 있으면 기본 버튼을 숨길 수 있다.
  showClose?: boolean
  children: ReactNode
}

// Tailwind가 빌드 시 클래스를 찾을 수 있도록 완성된 문자열로 정의한다.
const SIZE_CLASS = {
  lg: 'w-[min(760px,calc(100vw-36px))] p-10',
  md: 'w-[min(600px,calc(100vw-36px))] p-10',
  sm: 'w-[min(380px,calc(100vw-36px))] p-8',
  compact: 'w-[min(480px,calc(100vw-36px))] p-6 sm:p-8',
} as const

// backdrop 클릭도 dialog를 대상으로 발생하므로 좌표로 창 바깥인지 판별한다.
export function isOutsideDialog(event: {
  currentTarget: HTMLDialogElement
  clientX: number
  clientY: number
}) {
  const rect = event.currentTarget.getBoundingClientRect()

  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
}

export function Modal({
  open,
  onRequestClose,
  labelledBy,
  size = 'md',
  showClose = true,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // 내부에서 시작한 드래그를 바깥에서 끝내도 모달이 닫히지 않도록 누른 위치를 기억한다.
  const pressedOutsideRef = useRef(false)

  // 닫힘 애니메이션에는 마지막 내용을 유지하고, 다시 열면 key를 바꿔 내부 폼을 초기화한다.
  const [shownChildren, setShownChildren] = useState<ReactNode>(null)
  const [prevOpen, setPrevOpen] = useState(open)
  const [openCount, setOpenCount] = useState(open ? 1 : 0)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setOpenCount((count) => count + 1)
  }

  if (open && shownChildren !== children) setShownChildren(children)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        // 사진 고르는 창을 취소해도 파일 입력칸에서 cancel 이벤트가 나와 여기까지 올라온다.
        // dialog 자신이 받은 취소(ESC)만 닫기로 처리한다
        if (event.target !== event.currentTarget) return

        event.preventDefault()
        onRequestClose()
      }}
      onPointerDown={(event) => {
        pressedOutsideRef.current = event.target === event.currentTarget && isOutsideDialog(event)
      }}
      onClick={(event) => {
        const pressedOutside = pressedOutsideRef.current
        pressedOutsideRef.current = false

        if (pressedOutside && event.target === event.currentTarget && isOutsideDialog(event))
          onRequestClose()
      }}
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget && event.propertyName === 'opacity')
          setShownChildren(null)
      }}
      className={`glass-window m-auto max-h-[calc(100dvh-48px)] overflow-y-auto overscroll-contain rounded-2xl outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${SIZE_CLASS[size]}`}
    >
      {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
      <div tabIndex={-1} autoFocus className="outline-none" aria-hidden="true" />
      {showClose && (
        <button
          type="button"
          onClick={onRequestClose}
          aria-label="닫기"
          className="absolute right-2 top-2 flex size-11 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-text-strong"
        >
          <XMarkIcon className="size-6" />
        </button>
      )}
      <div key={openCount}>{shownChildren}</div>
    </dialog>
  )
}
