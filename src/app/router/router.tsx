import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'

import { LoginPage, SignupPage } from '../../pages/auth'
import { LandingPage } from '../../pages/landing'
import { MarketPage } from '../../pages/market'
import { AppLayout } from './AppLayout'
import { RequireAuth, RequireGuest, RequireOnboarded } from './guards'
import { RootLayout } from './RootLayout'
import { RouteFallback } from './RouteFallback'

// 배포 후 이전 청크 주소를 요청한 경우 새로고침으로 복구한다.
// sessionStorage가 사용 가능하면 재시도를 기록해 연속 새로고침을 막고, 로딩 성공 시 해제한다.
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
    // 저장소 접근이 차단돼도 예외가 라우트 로딩을 중단하지 않도록 한다.
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

// 초기 진입에 필요한 화면 외에는 경로에 접근할 때 로딩하고 인증 가드를 적용한다.
function lazyAuthed(
  load: () => Promise<{ default?: unknown } & Record<string, unknown>>,
  name: string,
) {
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
    // 모든 경로에서 초기 대기 화면과 스크롤 복원을 공유한다.
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
            <RequireOnboarded>
              <LoginPage />
            </RequireOnboarded>
          </RequireGuest>
        ),
      },
      // 설치한 앱의 첫 실행 소개. 한 번만 보는 화면이라 필요할 때 받아 온다.
      {
        path: '/onboarding',
        lazy: async () => {
          const { OnboardingPage } = await loadChunk(() => import('../../pages/onboarding'))
          return {
            element: (
              <RequireGuest>
                <OnboardingPage />
              </RequireGuest>
            ),
          }
        },
      },
      {
        path: '/signup',
        element: (
          <RequireGuest>
            <SignupPage />
          </RequireGuest>
        ),
      },
      // 비로그인 사용자도 초대를 확인할 수 있다. 로그인 안내와 참여 분기는 페이지가 처리한다.
      {
        path: '/invite/:code',
        lazy: async () => {
          const { MarketJoinPage } = await loadChunk(() => import('../../pages/market-join'))
          return { element: <MarketJoinPage /> }
        },
      },
      // 로그인한 뒤의 화면. 좁은 화면에서는 하단 탭이 함께 붙는다.
      {
        element: <AppLayout />,
        children: [
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
          {
            path: '/items/:itemId/edit',
            lazy: lazyAuthed(() => import('../../pages/product-edit'), 'ProductEditPage'),
          },
          {
            path: '/items/:itemId',
            lazy: lazyAuthed(() => import('../../pages/product-detail'), 'ProductDetailPage'),
          },
          {
            path: '/product/*',
            lazy: lazyAuthed(() => import('../../pages/product'), 'ProductPage'),
          },
          {
            path: '/item-dex',
            lazy: lazyAuthed(() => import('../../pages/item-dex'), 'ItemDexPage'),
          },
          {
            path: '/collection-items/:collectionItemId',
            lazy: lazyAuthed(
              () => import('../../pages/collection-item-detail'),
              'CollectionItemDetailPage',
            ),
          },
          {
            path: '/members/:memberId/item-dex',
            lazy: lazyAuthed(() => import('../../pages/member-item-dex'), 'MemberItemDexPage'),
          },
          // 거래 기록은 현재 물건 상태와 분리해 요청 당시 정보를 조회한다.
          {
            path: '/trade-requests/:requestType/:requestId',
            lazy: lazyAuthed(
              () => import('../../pages/trade-request-detail'),
              'TradeRequestDetailPage',
            ),
          },
          { path: '/chat', lazy: lazyAuthed(() => import('../../pages/chat'), 'ChatPage') },
          {
            path: '/friends',
            lazy: lazyAuthed(() => import('../../pages/friends'), 'FriendsPage'),
          },
          { path: '/my-page', lazy: lazyAuthed(() => import('../../pages/my-page'), 'MyPage') },
        ],
      },
    ],
  },
])
