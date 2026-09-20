import { useState } from 'react'
import { Link, NavLink } from 'react-router'

import { NotificationCenter } from './NotificationCenter'
import { ProfileMenu } from './ProfileMenu'

const navItems = [
  { to: '/market', label: '마켓' },
  { to: '/item-dex', label: '물건 도감' },
  { to: '/friends', label: '친구' },
  { to: '/my-page', label: '마이페이지' },
]

const focusStyle = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

interface HeaderProps {
  // 목록이 긴 화면에서는 스크롤해도 메뉴가 따라오게 한다.
  // 모든 화면에 걸면 짧은 화면에서는 공간만 차지하므로 필요한 곳에서만 켠다
  sticky?: boolean
}

export function Header({ sticky = false }: HeaderProps) {
  const [activePopover, setActivePopover] = useState<'notifications' | 'profile' | null>(null)

  return (
    <header className={`bg-bg ${sticky ? 'sticky top-0 z-30' : ''}`}>
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-6 py-2 md:grid-cols-[1fr_auto_1fr] md:py-3 lg:px-8">
        <Link
          to="/market"
          aria-label="FleaFlea 홈, 마켓으로 이동"
          className={`flex min-h-11 w-fit items-center gap-2 transition-opacity hover:opacity-80 ${focusStyle}`}
        >
          <div className="size-8 shrink-0 overflow-hidden rounded-full">
            <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
          </div>
          <span className="font-jua text-head-03 text-text-strong">FleaFlea</span>
        </Link>

        <nav
          aria-label="주 메뉴"
          className="col-span-2 row-start-2 flex items-center justify-between gap-1 border-t border-border/60 pt-1 md:col-span-1 md:col-start-2 md:row-start-1 md:justify-center md:gap-6 md:border-0 md:pt-0"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap border-b-2 px-1 text-body-04 transition-colors hover:text-primary sm:text-body-03 md:px-0 ${focusStyle} ${isActive ? 'border-primary font-bold text-primary' : 'border-transparent text-text'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-3 md:col-start-3">
          <NotificationCenter
            open={activePopover === 'notifications'}
            onOpenChange={(open) => setActivePopover(open ? 'notifications' : null)}
          />
          <ProfileMenu
            open={activePopover === 'profile'}
            onOpenChange={(open) => setActivePopover(open ? 'profile' : null)}
          />
        </div>
      </div>
    </header>
  )
}
