import { useState } from 'react'
import { Header } from '../../../widgets/header'
import { MarketCard, type Market } from '../../../entities/market'

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

const TABS = [
  { key: 'joined', label: '참여 중인 마켓' },
  { key: 'hosted', label: '내가 만든 마켓' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function MarketPage() {
  const [tab, setTab] = useState<TabKey>('joined')
  const isHostTab = tab === 'hosted'

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-*** px-6 py-8">
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
              onClick={() => setTab(key)}
              className={`mr-2 mt-10 rounded-full border px-5 py-2.5 text-body-03 font-semibold backdrop-blur-xl transition-all ${
                active
                  ? 'border-white bg-white text-text-strong shadow-[0_4px_14px_rgba(0,0,0,0.08)]'
                  : 'border-white/70 bg-white/40 text-text-muted hover:text-text-strong'
              }`}
            >
              {label}
            </button>
          )
        })}

        <div className="mt-8 flex flex-wrap items-end gap-6">
          {isHostTab ? (
            <>
              <MarketCard market={{ ...mockMarket, imageUrl: '/mascot/flea6.png' }} isHost />
              <MarketCard market={{ ...mockMarket, marketId: 2, title: '주말 비밀 장터', imageUrl: '/mascot/flea7.png' }} isHost />
            </>
          ) : (
            <>
              <MarketCard market={{ ...mockMarket, imageUrl: '/mascot/flea5.png' }} isHost={false} />
              <MarketCard market={{ ...mockMarket, marketId: 2, title: '주말 비밀 장터', imageUrl: '/mascot/flea2.png' }} isHost={false} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
