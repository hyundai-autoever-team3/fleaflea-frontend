import { useState } from 'react'
import { Header } from '../../../widgets/header'
import { MarketCard, type Market } from '../../../entities/market'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelShops } from './PixelShops'

// TODO: API 연결 후 제거
const mockMarket: Market = {
  marketId: 1,
  hostId: 1,
  title: '우리끼리 마켓',
  description: '친구들과 여는 작은 비밀 마켓',
  imageUrl: null,
  startDate: '2026-09-20',
  endDate: '2026-09-21',
  status: 'OPEN',
  createdAt: '',
  updatedAt: '',
}

const HOSTED_MARKETS: Market[] = [
  { ...mockMarket, imageUrl: '/mascot/flea6.png' },
  { ...mockMarket, marketId: 2, title: '주말 비밀 장터', imageUrl: '/mascot/flea7.png' },
]

const JOINED_MARKETS: Market[] = [
  { ...mockMarket, marketId: 3, imageUrl: '/mascot/flea5.png' },
  { ...mockMarket, marketId: 4, title: '주말 비밀 장터', description: '안 쓰는 물건을 나누는 주말 장터', imageUrl: '/mascot/flea2.png' },
]

const TABS = [
  { key: 'hosted', label: '내가 만든 마켓' },
  { key: 'joined', label: '참여 중인 마켓' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function MarketPage() {
  const [tab, setTab] = useState<TabKey>('hosted')
  const [keyword, setKeyword] = useState('')
  const isHostTab = tab === 'hosted'

  const query = keyword.trim().toLowerCase()
  const markets = (isHostTab ? HOSTED_MARKETS : JOINED_MARKETS).filter(
      (market) => market.title.toLowerCase().includes(query) ||
          (market.description ?? '').toLowerCase().includes(query),
      )

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        {/* 히어로 — 마스코트 + 말풍선 */}
        <div className="relative min-h-96 overflow-hidden rounded-3xl bg-[image:var(--gradient-dreamy)] p-12">
          <h1 className="mt-20 max-w-[60%] text-head-00 font-bold text-text-strong">
            친구들과 여는
            <br />
            우리들만의 비밀 마켓
          </h1>

          <div className="absolute right-8 top-38 max-w-64 rounded-2xl bg-bg px-4 py-3 text-body-03 text-text-muted shadow-md">
            친구들과 함께 마켓을 열어보세요!
            <span className="absolute -bottom-1.5 left-8 size-3 rotate-45 bg-bg shadow-md" />
          </div>
          <div className="absolute bottom-6 right-16 h-4 w-28 rounded-full bg-black/15 blur-md" />
          <img
            src="/mascot/flea.png"
            alt=""
            className="absolute bottom-4 right-10 size-40 object-contain"
          />
        </div>

        {/* 글라스 탭 */}
        {TABS.map(({ key, label }) => {
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTab(key)
                setKeyword('')
              }}
              style={{ clipPath: pixelBox() }}
              className={`mr-2 mt-10 px-5 py-2.5 text-body-03 font-semibold transition-colors duration-200 ${
                active
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong'
              }`}
            >
              {label}
            </button>
          )
        })}

        {/* 마켓 검색 */}
          <label className="mt-5 flex w-full max-w-md items-center gap-2 rounded-full bg-primary-subtle px-5 py-3 focus-within:ring-2 focus-within:ring-primary-tint">
            <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={isHostTab ? '내가 만든 마켓 이름이나 설명으로 검색' : '참여 중인 마켓 이름이나 설명으로 검색'}
              aria-label={isHostTab ? '내가 만든 마켓 검색' : '참여 중인 마켓 검색'}
              className="w-full bg-transparent text-body-03 outline-none placeholder:text-text-muted/50"
            />
          </label>


        <div className="mt-8 flex flex-col items-start gap-14">
          {markets.map((market) => (
            <MarketCard key={market.marketId} market={market} isHost={isHostTab} />
          ))}
          {markets.length === 0 && (
            <p className="w-full py-12 text-center text-body-03 text-text-muted">
              {query ? `'${keyword.trim()}'에 맞는 마켓이 없어요` : '아직 마켓이 없어요'}
            </p>
          )}
        </div>

        {/* 마켓 거리 보도블록 */}
        <PixelShops className="mt-3 justify-end pr-4" />
        <div
          className="h-6 rounded-md border-t-4 border-primary-tint"
          style={{ background: 'repeating-linear-gradient(90deg, var(--color-primary-subtle) 0 46px, var(--color-primary-tint) 46px 48px)' }}
        />
      </div>
    </div>
  )
}
