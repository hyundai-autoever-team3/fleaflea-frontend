import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router'

import { useMyProfile } from '../../../entities/user'
import { useLogout } from '../../../features/auth'
import { Avatar } from '../../../shared/ui/avatar'

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const MENU_ITEM =
  'flex min-h-11 w-full items-center px-4 text-left text-body-04 text-glass-ink/92 transition-colors hover:bg-glass-strong'

interface ProfileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileMenu({ open, onOpenChange }: ProfileMenuProps) {
  const menuId = useId()
  const { isLoggingOut, handleLogout } = useLogout()

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const profileQuery = useMyProfile()

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      onOpenChange(false)
      // 키보드로 메뉴를 닫으면 메뉴를 연 버튼으로 초점을 복원한다.
      triggerRef.current?.focus()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onOpenChange, open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="내 프로필 메뉴"
        className={`flex size-11 items-center justify-center transition-opacity hover:opacity-80 ${FOCUS_RING}`}
      >
        <Avatar
          profileImageUrl={profileQuery.data?.profileImageUrl ?? null}
          size="sm"
          className="ring-1 ring-border"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="내 프로필"
          className="glass-panel absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-2xl py-1"
        >
          <p className="truncate border-b border-glass-line px-4 pb-2 pt-1.5 text-xs text-glass-ink/58">
            {profileQuery.data?.nickname ?? '내 계정'}
          </p>
          <Link
            to="/my-page"
            role="menuitem"
            viewTransition
            onClick={() => onOpenChange(false)}
            className={`${MENU_ITEM} ${FOCUS_RING}`}
          >
            마이페이지
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className={`${MENU_ITEM} disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isLoggingOut ? '로그아웃하는 중...' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  )
}
