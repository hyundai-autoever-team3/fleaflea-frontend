import { useLayoutEffect, useRef, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  open: boolean
  onRequestClose: () => void
  labelledBy?: string
  // md = 폼처럼 가로가 필요한 모달(기본), sm = 프로필·확인처럼 세로로 좁게,
  // lg = 고르기 그리드처럼 한 화면에 여러 칸을 늘어놓아야 할 때,
  // compact = 사진 한 장과 짧은 입력·확인으로 구성된 요청 화면
  size?: 'md' | 'sm' | 'lg' | 'compact'
  // 내용 안에 닫기 버튼이 따로 있어 오른쪽 위 X가 중복될 때 false
  showClose?: boolean
  children: ReactNode
}

// Tailwind는 소스의 문자열을 그대로 훑으므로 클래스를 조립하지 않고 통째로 적어 둠
const SIZE_CLASS = {
  lg: 'w-[min(760px,calc(100vw-36px))] p-10',
  md: 'w-[min(600px,calc(100vw-36px))] p-10',
  sm: 'w-[min(380px,calc(100vw-36px))] p-8',
  compact: 'w-[min(480px,calc(100vw-36px))] p-6 sm:p-8',
} as const

// 클릭 좌표가 모달 창 사각형 밖이면 바깥(backdrop) 클릭.
// <dialog>를 직접 쓰는 랜딩 초대 모달도 같은 판정을 쓰도록 내보낸다
export function isOutsideDialog(event: MouseEvent<HTMLDialogElement>) {
  const rect = event.currentTarget.getBoundingClientRect()
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
}

// 랜딩 페이지 초대 코드 모달과 같은 <dialog> 스타일. 열림/닫힘 페이드는 app/styles/animations.css의 dialog 전환
export function Modal({ open, onRequestClose, labelledBy, size = 'md', showClose = true, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // 입력칸에서 드래그하다 바깥에서 마우스를 떼도 닫히지 않도록, 누른 위치도 바깥이었는지 기억
  const pressedOutsideRef = useRef(false)

  // 닫히는 페이드 동안 빈 창이 보이지 않도록 마지막 내용을 유지하고, 열 때마다 key로 새로 만듦
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
        event.preventDefault()
        onRequestClose()
      }}
      onMouseDown={(event) => {
        pressedOutsideRef.current = event.target === event.currentTarget && isOutsideDialog(event)
      }}
      onClick={(event) => {
        const pressedOutside = pressedOutsideRef.current
        pressedOutsideRef.current = false
        if (pressedOutside && event.target === event.currentTarget && isOutsideDialog(event)) onRequestClose()
      }}
      onTransitionEnd={(event) => {
        if (!open && event.target === event.currentTarget && event.propertyName === 'opacity') setShownChildren(null)
      }}
      // 내용이 길면 스크롤은 되지만 스크롤바는 숨김. 열릴 때 창 자체에 생기는 포커스 테두리도 제거
      className={`m-auto max-h-[calc(100dvh-48px)] overflow-y-auto overscroll-contain rounded-2xl shadow-lg outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${SIZE_CLASS[size]}`}
    >
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
