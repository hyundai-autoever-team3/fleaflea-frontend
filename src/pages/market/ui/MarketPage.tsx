import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { Header } from '../../../widgets/header'
import { MarketCard, marketKeys, useMyMarkets } from '../../../entities/market'
import { useSessionStore } from '../../../entities/session'
import { useMyProfile } from '../../../entities/user'
import { InviteLinkContent } from '../../../features/market-invite'
import { JoinMarketForm, type JoinMarketResponse } from '../../../features/market-join'
import { CreateMarketForm, type CreateMarketResponse } from '../../../features/market-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { PixelShops } from './PixelShops'

const TABS = [
  { key: 'hosted', label: '내가 만든 마켓' },
  { key: 'joined', label: '참여 중인 마켓' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_EMPTY: Record<TabKey, { title: string; description: string }> = {
  hosted: { title: '아직 연 마켓이 없어요', description: '위에서 친구들과 함께할 첫 플리마켓을 만들어보세요!' },
  joined: { title: '아직 참여한 마켓이 없어요', description: '친구에게 받은 초대 링크로 마켓에 참여해보세요!' },
}

function EmptyState({ image, title, description }: { image: string; title: string; description: string }) {
  return (
    <div className="flex w-full flex-col items-center pb-14 pt-24 text-center">
      <img src={image} alt="" className="h-24 w-auto object-contain [image-rendering:pixelated]" />
      <h3 className="mt-3 text-xl font-bold text-text-strong">{title}</h3>
      <p className="mt-1 text-body-03 text-text-muted">{description}</p>
    </div>
  )
}

type ModalKind = 'create' | 'join' | null

export function MarketPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const marketsQuery = useMyMarkets()
  const meQuery = useMyProfile()

  const [tab, setTab] = useState<TabKey>('hosted')
  const [keyword, setKeyword] = useState('')
  const [modal, setModal] = useState<ModalKind>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [createdMarket, setCreatedMarket] = useState<CreateMarketResponse | null>(null)
  const isHostTab = tab === 'hosted'

  // 내 정보 조회가 401/403이면 토큰이 가짜거나 만료된 것 → 세션을 지워 RequireAuth가 로그인으로 보내게 함
  useEffect(() => {
    const status = isAxiosError(meQuery.error) ? meQuery.error.response?.status : undefined
    if (status === 401 || status === 403) useSessionStore.getState().clearSession()
  }, [meQuery.error])

  const isLoading = marketsQuery.isPending || meQuery.isPending
  const isError = marketsQuery.isError || meQuery.isError

  // 개설자도 참여자로 등록되므로, 한 목록을 호스트 여부로 나눔
  const myMemberId = meQuery.data?.memberId
  const allMarkets = marketsQuery.data ?? []
  const hostedMarkets = allMarkets.filter((market) => market.hostId === myMemberId)
  const joinedMarkets = allMarkets.filter((market) => market.hostId !== myMemberId)

  const hasAnyMarket = allMarkets.length > 0
  const tabMarkets = isHostTab ? hostedMarkets : joinedMarkets
  const query = keyword.trim().toLowerCase()
  const markets = tabMarkets.filter(
    (market) =>
      market.title.toLowerCase().includes(query) ||
      (market.description ?? '').toLowerCase().includes(query),
  )

  function closeModal() {
    setModal(null)
    setIsFormDirty(false)
    setCreatedMarket(null)
  }

  function requestCloseModal() {
    if (modal === 'create' && !createdMarket && isFormDirty && !window.confirm('작성 중인 내용이 사라져요. 닫을까요?')) return
    closeModal()
  }

  function handleCreated(market: CreateMarketResponse) {
    setCreatedMarket(market)
    void queryClient.invalidateQueries({ queryKey: marketKeys.all })
  }

  function handleJoined(market: JoinMarketResponse) {
    closeModal()
    void queryClient.invalidateQueries({ queryKey: marketKeys.all })
    navigate(`/market/${market.marketId}`)
  }

  function retry() {
    void marketsQuery.refetch()
    void meQuery.refetch()
  }

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        {/* 히어로 — 마스코트 + 말풍선 + 시작 버튼 */}
        <div className="relative min-h-96 overflow-hidden rounded-3xl bg-[image:var(--gradient-dreamy)] p-12">
          <h1 className="mt-14 max-w-[60%] text-head-00 font-bold text-text-strong">
            친구들과 여는
            <br />
            우리들만의 비밀 마켓
          </h1>

          <div className="relative z-10 mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setModal('create')}
              style={{ clipPath: pixelBox(4) }}
              className="bg-primary px-7 py-3.5 text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
            >
              + 플리마켓 만들기
            </button>
            {/* 픽셀 테두리: 바깥 연보라 판 + 안쪽 버튼 면 */}
            <button
              type="button"
              onClick={() => setModal('join')}
              style={{ clipPath: pixelBox(4) }}
              className="group bg-primary-tint p-[2px]"
            >
              <span
                style={{ clipPath: pixelBox(4) }}
                className="block bg-primary-subtle px-7 py-3 text-body-03 font-bold text-text-strong transition-colors duration-200 group-hover:bg-white"
              >
                초대 링크로 참여하기
              </span>
            </button>
          </div>

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

        {isLoading ? (
          <p className="py-24 text-center text-body-03 text-text-muted">마켓을 불러오는 중이에요...</p>
        ) : isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="text-body-03 text-text-muted">마켓 목록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={retry}
              style={{ clipPath: pixelBox() }}
              className="mt-4 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : hasAnyMarket ? (
          <>
            {/* 탭 */}
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

            {/* 마켓 검색: 현재 탭에 마켓이 있을 때만 */}
            {tabMarkets.length > 0 && (
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
                  className="w-full bg-transparent text-body-03 text-text-strong outline-none placeholder:text-text-muted/50"
                />
              </label>
            )}

            <div className="mt-8 flex flex-col items-start gap-14">
              {markets.map((market) => (
                <MarketCard key={market.marketId} market={market} isHost={isHostTab} />
              ))}

              {tabMarkets.length === 0 && <EmptyState image="/mascot/flea4.png" {...TAB_EMPTY[tab]} />}
              {tabMarkets.length > 0 && markets.length === 0 && (
                <p className="w-full py-12 text-center text-body-03 text-text-muted">
                  '{keyword.trim()}'에 맞는 마켓이 없어요
                </p>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            image="/mascot/flea10.png"
            title="아직 마켓이 없어요"
            description="위에서 첫 플리마켓을 만들거나, 친구에게 받은 초대 링크로 참여해보세요!"
          />
        )}

        {/* 마켓 거리 보도블록 */}
        <PixelShops className="mt-16 justify-end pr-4" />
        <div
          className="h-6 rounded-md border-t-4 border-primary-tint"
          style={{ background: 'repeating-linear-gradient(90deg, var(--color-primary-subtle) 0 46px, var(--color-primary-tint) 46px 48px)' }}
        />
      </div>

      <Modal open={modal !== null} onRequestClose={requestCloseModal} labelledBy="market-modal-title">
        {modal === 'join' && (
          <>
            <h2 id="market-modal-title" className="text-head-03 font-bold text-text-strong">
              초대 링크로 참여하기
            </h2>
            <p className="mt-1 text-body-04 text-text-muted">친구에게 받은 초대 링크나 코드를 붙여 넣어 주세요.</p>
            <img src={MASCOTS.wink} alt="" className="mx-auto my-6 h-20 object-contain [image-rendering:pixelated]" />
            <JoinMarketForm onJoined={handleJoined} />
          </>
        )}

        {/* 마켓 만들기 → 초대 링크: 한 모달 안에서 단계 전환 */}
        {modal === 'create' &&
          (createdMarket ? (
            <InviteLinkContent
              titleId="market-modal-title"
              marketTitle={createdMarket.title}
              inviteCode={createdMarket.inviteCode}
              onDone={() => {
                const { marketId } = createdMarket
                closeModal()
                navigate(`/market/${marketId}`)
              }}
            />
          ) : (
            <>
              <h2 id="market-modal-title" className="text-head-03 font-bold text-text-strong">
                플리마켓 만들기
              </h2>
              <p className="mt-1 text-body-04 text-text-muted">마켓을 만들면 친구들에게 보낼 초대 링크가 생겨요.</p>
              <div className="mt-6">
                <CreateMarketForm onCreated={handleCreated} onDirtyChange={setIsFormDirty} />
              </div>
            </>
          ))}
      </Modal>
    </div>
  )
}
