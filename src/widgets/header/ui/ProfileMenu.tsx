import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { useMyProfile } from '../../../entities/user'
import { logout } from '../../../features/auth'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { useToastStore } from '../../../shared/ui/toast'

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'
const MENU_ITEM = 'flex min-h-11 w-full items-center gap-2.5 px-3 text-left text-body-04 font-bold text-text-strong transition-colors hover:bg-primary-subtle'

// 프로필 사진을 누르면 열리는 작은 메뉴. 로그아웃처럼 자주 쓰는 동작을
// 마이페이지 안쪽까지 들어가지 않고 어디서든 할 수 있게 한다
export function ProfileMenu() {
  const menuId = useId()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const profileQuery = useMyProfile()

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      // 키보드로 닫았으면 누른 자리로 초점을 돌려준다
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      // 서버의 refresh token을 지운다. 실패해도 이 기기에서는 로그아웃돼야 하므로 막지 않는다
      await logout()
    } catch {
      // 무시 — 아래에서 로컬 세션을 비운다
    }
    useSessionStore.getState().clearSession()
    useToastStore.getState().showToast('로그아웃했어요')
    void navigate('/login', { replace: true, viewTransition: true })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="내 프로필 메뉴"
        className={`flex size-11 items-center justify-center transition-opacity hover:opacity-80 ${FOCUS_RING}`}
      >
        <Avatar profileImageUrl={profileQuery.data?.profileImageUrl ?? null} size="sm" className="ring-1 ring-border" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="내 프로필"
          style={{ clipPath: pixelBox(4) }}
          className="absolute right-0 top-full z-20 mt-1 w-52 bg-primary-tint p-[2px] shadow-lg"
        >
          <div style={{ clipPath: pixelBox(4) }} className="bg-bg py-2">
            {/* 누구로 로그인했는지 먼저 보여준다 — 계정이 여럿인 사람에게 필요한 정보 */}
            <p className="truncate px-3 pb-2 text-xs text-text-muted">
              {profileQuery.data?.nickname ?? '내 계정'}
            </p>
            <Link
              to="/my-page"
              role="menuitem"
              viewTransition
              onClick={() => setOpen(false)}
              className={`${MENU_ITEM} ${FOCUS_RING}`}
            >
              <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0 text-text-muted" />
              내 정보 보기
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              className={`${MENU_ITEM} disabled:opacity-50 ${FOCUS_RING}`}
            >
              <Sprite rows={GLYPHS.exit} className="w-3.5 shrink-0 text-text-muted" />
              {isLoggingOut ? '로그아웃하는 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
