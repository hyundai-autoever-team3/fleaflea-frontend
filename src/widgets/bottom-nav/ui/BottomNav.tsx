import {
  BookOpenIcon,
  BuildingStorefrontIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import {
  BookOpenIcon as BookOpenSolidIcon,
  BuildingStorefrontIcon as BuildingStorefrontSolidIcon,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
  UsersIcon as UsersSolidIcon,
} from '@heroicons/react/24/solid'
import { NavLink } from 'react-router'

// 지금 있는 탭은 채운 아이콘, 나머지는 선 아이콘으로 그려 색을 못 봐도 구분되게 한다
const tabs = [
  {
    to: '/market',
    label: '마켓',
    Icon: BuildingStorefrontIcon,
    ActiveIcon: BuildingStorefrontSolidIcon,
  },
  { to: '/friends', label: '친구', Icon: UsersIcon, ActiveIcon: UsersSolidIcon },
  { to: '/item-dex', label: '물건 도감', Icon: BookOpenIcon, ActiveIcon: BookOpenSolidIcon },
  {
    to: '/chat',
    label: '채팅',
    Icon: ChatBubbleLeftRightIcon,
    ActiveIcon: ChatBubbleLeftRightSolidIcon,
  },
  { to: '/my-page', label: '마이페이지', Icon: UserCircleIcon, ActiveIcon: UserCircleSolidIcon },
]

// 설치한 앱에서 헤더의 메뉴 줄을 대신하는 하단 탭. 브라우저 탭에서는 헤더 메뉴를 쓴다(AppLayout이 가른다).
// 높이를 바꾸면 AppLayout의 아래 여백과 Toast·알림 패널의 위치도 함께 맞춘다
export function BottomNav() {
  return (
    <nav
      aria-label="주 메뉴"
      // env(safe-area-inset-*)는 기기가 알려주는 안전 영역이다. 아이폰 홈 막대나
      // 가로로 눕혔을 때의 노치에 탭이 가려지지 않도록 그만큼 안쪽으로 들인다
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-bg pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      <ul className="mx-auto grid h-14 max-w-lg grid-cols-5">
        {tabs.map(({ to, label, Icon, ActiveIcon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex h-full select-none flex-col items-center justify-center gap-0.5 whitespace-nowrap text-[11px] transition-colors [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong ${
                  isActive ? 'font-bold text-primary' : 'text-text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <ActiveIcon className="size-6" /> : <Icon className="size-6" />}
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
