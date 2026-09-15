import { createBrowserRouter } from 'react-router'

import { LoginPage, SignupPage } from '../../pages/auth'
import { FriendsPage } from '../../pages/friends'
import { HomePage } from '../../pages/home'
import { ItemDexPage } from '../../pages/item-dex'
import { LandingPage } from '../../pages/landing'
import { MarketJoinPage, MarketPage } from '../../pages/market'
import { MarketDetailPage } from '../../pages/market-detail'
import { MyPage } from '../../pages/my-page'
import { ProductPage } from '../../pages/product'
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
