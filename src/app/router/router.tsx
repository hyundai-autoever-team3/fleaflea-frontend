import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'

import { LoginPage, SignupPage } from '../../pages/auth'
import { LandingPage } from '../../pages/landing'
import { MarketPage } from '../../pages/market'
import { RequireAuth, RequireGuest } from './guards'
import { RootLayout } from './RootLayout'
import { RouteFallback } from './RouteFallback'

// 배포가 바뀌면 조각 파일 이름의 해시도 함께 바뀐다. 탭을 열어둔 채 배포가 넘어가면
// 그 탭은 사라진 이름을 부르게 되어 화면 이동이 통째로 실패한다.
// 한 번만 새로고침해 새 index.html을 받으면 풀리므로, 그렇게 되살린다.
// 새로고침하고도 실패하면 진짜 문제이므로 되풀이하지 않는다
const RELOAD_FLAG = 'chunk-reloaded'

function readFlag() {
  try {
    return sessionStorage.getItem(RELOAD_FLAG)
  } catch {
    return null
  }
}

function writeFlag(value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(RELOAD_FLAG)
    else sessionStorage.setItem(RELOAD_FLAG, value)
  } catch {
    // 저장소를 막아둔 브라우저에서는 되살리기를 포기한다
  }
}

async function loadChunk<T>(load: () => Promise<T>): Promise<T> {
  try {
    const module = await load()
    writeFlag(null)
    return module
  } catch (error) {
    if (!readFlag()) {
      writeFlag('1')
      window.location.reload()
    }
    throw error
  }
}

// 첫 진입 화면(랜딩·로그인·가입·마켓)만 함께 받고, 나머지는 그 화면으로 갈 때 받는다.
// 전부 정적으로 두면 랜딩만 보려는 사람도 도감·마이페이지 코드를 모두 내려받게 된다
function lazyAuthed(load: () => Promise<{ default?: unknown } & Record<string, unknown>>, name: string) {
  return async () => {
    const module = await loadChunk(load)
    const Page = module[name] as () => ReactNode
    return {
      element: (
        <RequireAuth>
          <Page />
        </RequireAuth>
      ),
    }
  }
}

export const router = createBrowserRouter([
  {
    // 경로 없는 감싸는 라우트 — 아래 화면들이 전부 이 대기 화면과 스크롤 기록을 함께 쓴다
    element: <RootLayout />,
    HydrateFallback: RouteFallback,
    children: [
  {
    path: '/',
    element: (
      <RequireGuest>
        <LandingPage />
      </RequireGuest>
    ),
  },
  {
    path: '/login',
    element: (
      <RequireGuest>
        <LoginPage />
      </RequireGuest>
    ),
  },
  {
    path: '/signup',
    element: (
      <RequireGuest>
        <SignupPage />
      </RequireGuest>
    ),
  },
  // Semi-public: reachable while logged out. MarketJoinPage itself branches on session
  // state (preview + login prompt vs. join confirmation), so no guard here.
  {
    path: '/invite/:code',
    lazy: async () => {
      const { MarketJoinPage } = await loadChunk(() => import('../../pages/market-join'))
      return { element: <MarketJoinPage /> }
    },
  },
  { path: '/home', lazy: lazyAuthed(() => import('../../pages/home'), 'HomePage') },
  {
    path: '/market/:marketId/items/new',
    lazy: lazyAuthed(() => import('../../pages/product-create'), 'ProductCreatePage'),
  },
  {
    path: '/market/:marketId',
    lazy: lazyAuthed(() => import('../../pages/market-detail'), 'MarketDetailPage'),
  },
  {
    path: '/market/*',
    element: (
      <RequireAuth>
        <MarketPage />
      </RequireAuth>
    ),
  },
  { path: '/items/:itemId/edit', lazy: lazyAuthed(() => import('../../pages/product-edit'), 'ProductEditPage') },
  { path: '/items/:itemId', lazy: lazyAuthed(() => import('../../pages/product-detail'), 'ProductDetailPage') },
  { path: '/product/*', lazy: lazyAuthed(() => import('../../pages/product'), 'ProductPage') },
  { path: '/item-dex', lazy: lazyAuthed(() => import('../../pages/item-dex'), 'ItemDexPage') },
  // 도감 물건 상세. 남의 물건이면 대여·교환·구걸 요청을 여기서 보냄
  {
    path: '/collection-items/:collectionItemId',
    lazy: lazyAuthed(() => import('../../pages/collection-item-detail'), 'CollectionItemDetailPage'),
  },
  // 남의 도감. 내 도감(/item-dex)과 화면은 닮았지만 공개 물건만 보이고 등록·수정이 없음
  {
    path: '/members/:memberId/item-dex',
    lazy: lazyAuthed(() => import('../../pages/member-item-dex'), 'MemberItemDexPage'),
  },
  { path: '/friends', lazy: lazyAuthed(() => import('../../pages/friends'), 'FriendsPage') },
  { path: '/my-page', lazy: lazyAuthed(() => import('../../pages/my-page'), 'MyPage') },
    ],
  },
])
