import { Link } from 'react-router'

import { BrandMark } from '../../../shared/ui/brand'


export interface LandingNavItem {
  id: string
  label: string
}

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

export function LandingHeader({
  navItems,
  activeId,
}: {
  navItems: LandingNavItem[]
  activeId: string | null
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-bg/90 px-6 py-4 backdrop-blur">
      <a
        href="#top"
        aria-label="맨 위로"
        className={`flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80 ${FOCUS_RING}`}
      >
        <BrandMark />
      </a>

      <div className="flex min-w-0 items-center gap-3 sm:gap-6">
        <nav aria-label="랜딩 목차" className="hidden gap-6 sm:flex">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`whitespace-nowrap text-body-03 transition-colors hover:text-primary ${
                activeId === item.id ? 'font-bold text-primary' : 'text-text-muted'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* 소개를 다 읽지 않고 바로 들어가려는 사람을 위해 로그인을 헤더에 둔다.
            목차 옆에 나란히 서는 자리라 버튼으로 세우지 않고 같은 글자 크기로 둔다.
            가입은 화면 아래 본래 자리에 있으므로 여기서 되풀이하지 않는다 */}
        <Link
          to="/login"
          viewTransition
          className={`shrink-0 whitespace-nowrap text-body-03 text-text-muted transition-colors hover:text-primary ${FOCUS_RING}`}
        >
          로그인
        </Link>
      </div>
    </header>
  )
}
