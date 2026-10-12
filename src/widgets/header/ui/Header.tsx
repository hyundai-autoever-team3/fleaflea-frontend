import { useState } from 'react'
import { Link, NavLink } from 'react-router'

import { isStandalone } from '../../../shared/lib/pwa'
import { BrandMark } from '../../../shared/ui/brand'
import { NotificationCenter } from './NotificationCenter'
import { ProfileMenu } from './ProfileMenu'

const navItems = [
  { to: '/market', label: '마켓' },
  { to: '/item-dex', label: '물건 도감' },
  { to: '/friends', label: '친구' },
  { to: '/my-page', label: '마이페이지' },
]

const focusStyle =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

// 마이페이지는 본문에 물건 도감·친구 바로가기가 있어 상단 메뉴를 숨긴다.
export function Header({ showNav = true }: { showNav?: boolean }) {
  const [activePopover, setActivePopover] = useState<'notifications' | 'profile' | null>(null)
  // 설치한 앱에서는 하단 탭(widgets/bottom-nav)이 메뉴와 마이페이지를 맡으므로 헤더에는 알림만 남긴다
  const inApp = isStandalone()

  return (
    <header className="sticky top-0 z-30">
      {/* 스크롤할 때 본문이 헤더 밑에서 딱 잘려 보이지 않도록 반투명 흰 면 뒤로 흐리게 비치게 한다.
          header 자체에 backdrop-filter를 주면 그 안의 알림·프로필 메뉴(glass-panel)가 페이지를
          흐리게 하지 못해 비쳐 보이므로, 배경만 별도 층으로 둔다.
          backdrop-filter를 지원하지 않는 브라우저는 기존처럼 불투명한 흰 배경을 쓴다. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-bg supports-[backdrop-filter]:bg-bg/80 supports-[backdrop-filter]:backdrop-blur-md"
      />
      <div className="mx-auto grid w-full max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-6 py-2 md:grid-cols-[1fr_auto_1fr] md:py-3 lg:px-8">
        <Link
          to="/market"
          aria-label="FleaFlea 홈, 마켓으로 이동"
          className={`flex min-h-11 w-fit items-center gap-2 transition-opacity hover:opacity-80 ${focusStyle}`}
        >
          <BrandMark />
        </Link>

        {showNav && !inApp && (
          <nav
            aria-label="주 메뉴"
            className="col-span-2 row-start-2 flex items-center justify-between gap-1 border-t border-border/60 pt-1 md:col-span-1 md:col-start-2 md:row-start-1 md:justify-center md:gap-6 md:border-0 md:pt-0"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap px-1 text-body-04 transition-colors hover:text-primary sm:text-body-03 md:px-0 ${focusStyle} ${isActive ? 'font-bold text-primary' : 'text-text'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-start-3">
          <NotificationCenter
            open={activePopover === 'notifications'}
            onOpenChange={(open) => setActivePopover(open ? 'notifications' : null)}
          />
          {!inApp && (
            <ProfileMenu
              open={activePopover === 'profile'}
              onOpenChange={(open) => setActivePopover(open ? 'profile' : null)}
            />
          )}
        </div>
      </div>
    </header>
  )
}
