import { createBrowserRouter } from 'react-router'

import { LoginPage, SignupPage } from '../../pages/auth'
import { FriendsPage } from '../../pages/friends'
import { HomePage } from '../../pages/home'
import { ItemDexPage } from '../../pages/item-dex'
import { LandingPage } from '../../pages/landing'
import { MarketJoinPage, MarketPage } from '../../pages/market'
import { MarketDetailPage } from '../../pages/market-detail'
import { MemberItemDexPage } from '../../pages/member-item-dex'
import { MyPage } from '../../pages/my-page'
import { ProductPage } from '../../pages/product'
import { ProductCreatePage } from '../../pages/product-create'
import { ProductDetailPage } from '../../pages/product-detail'
import { ProductEditPage } from '../../pages/product-edit'
import { RequireAuth, RequireGuest } from './guards'

export const router = createBrowserRouter([
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
  { path: '/invite/:code', element: <MarketJoinPage /> },
  {
    path: '/home',
    element: (
      <RequireAuth>
        <HomePage />
      </RequireAuth>
    ),
  },
  {
    path: '/market/:marketId/items/new',
    element: (
      <RequireAuth>
        <ProductCreatePage />
      </RequireAuth>
    ),
  },
  {
    path: '/market/:marketId',
    element: (
      <RequireAuth>
        <MarketDetailPage />
      </RequireAuth>
    ),
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
    element: (
      <RequireAuth>
        <ProductEditPage />
      </RequireAuth>
    ),
  },
  {
    path: '/items/:itemId',
    element: (
      <RequireAuth>
        <ProductDetailPage />
      </RequireAuth>
    ),
  },
  {
    path: '/product/*',
    element: (
      <RequireAuth>
        <ProductPage />
      </RequireAuth>
    ),
  },
  {
    path: '/item-dex',
    element: (
      <RequireAuth>
        <ItemDexPage />
      </RequireAuth>
    ),
  },
  // 남의 도감. 내 도감(/item-dex)과 화면은 닮았지만 공개 물건만 보이고 등록·수정이 없음
  {
    path: '/members/:memberId/item-dex',
    element: (
      <RequireAuth>
        <MemberItemDexPage />
      </RequireAuth>
    ),
  },
  {
    path: '/friends',
    element: (
      <RequireAuth>
        <FriendsPage />
      </RequireAuth>
    ),
  },
  {
    path: '/my-page',
    element: (
      <RequireAuth>
        <MyPage />
      </RequireAuth>
    ),
  },
])
