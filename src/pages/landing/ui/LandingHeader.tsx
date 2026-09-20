import { SparklesIcon } from '@heroicons/react/24/outline'
import { Link } from 'react-router'

import { pixelBox } from '../../../shared/lib/pixel'

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
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-bg/90 px-6 py-4 backdrop-blur">
      <div className="flex shrink-0 items-center gap-2">
        <div className="size-8 overflow-hidden rounded-full">
          <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover" />
        </div>
        <span className="font-jua text-body-02 text-text-strong">FLEE</span>
        <SparklesIcon className="size-4 text-primary" />
      </div>

      <div className="flex min-w-0 items-center gap-4 sm:gap-6">
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
            가입은 화면 아래 본래 자리에 있으므로 여기서 되풀이하지 않는다 */}
        <Link
          to="/login"
          viewTransition
          style={{ clipPath: pixelBox(3) }}
          className={`flex min-h-10 shrink-0 items-center whitespace-nowrap bg-primary px-4 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 ${FOCUS_RING}`}
        >
          로그인
        </Link>
      </div>
    </header>
  )
}
