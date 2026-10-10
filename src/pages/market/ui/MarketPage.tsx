import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { isAxiosError } from 'axios'

import { Header } from '../../../widgets/header'
import { MarketCard, useMyMarkets } from '../../../entities/market'
import { useSessionStore } from '../../../entities/session'
import { useMyProfile } from '../../../entities/user'
import { InviteLinkContent } from '../../../features/market-invite'
import { JoinMarketForm, type JoinMarketResponse } from '../../../features/market-join'
import { CreateMarketForm, type CreateMarketResponse } from '../../../features/market-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { LoadingScreen } from '../../../shared/ui/loading-screen'
import { Modal } from '../../../shared/ui/modal'
import { PixelShops } from './PixelShops'

const TABS = [
  { key: 'joined', label: '참여 중인 마켓' },
  { key: 'hosted', label: '내가 만든 마켓' },
] as const

type TabKey = (typeof TABS)[number]['key']

const TAB_EMPTY: Record<TabKey, { title: string; description: string }> = {
  hosted: {
    title: '아직 연 마켓이 없어요',
    description: '위에서 친구들과 함께할 첫 플리마켓을 만들어보세요!',
  },
  joined: {
    title: '아직 참여한 마켓이 없어요',
    description: '마켓을 직접 열거나, 친구에게 받은 초대 링크로 참여해보세요!',
  },
}

function EmptyState({
  image,
  title,
  description,
}: {
  image: string
  title: string
  description: string
}) {
  return (
    <div className="flex w-full flex-col items-center pb-14 pt-24 text-center">
      <img
        draggable={false}
        src={image}
        alt=""
        className="h-24 w-auto object-contain [image-rendering:pixelated]"
      />
      <h3 className="mt-3 text-xl font-bold text-text-strong">{title}</h3>
      <p className="mt-1 text-body-03 text-text-muted">{description}</p>
    </div>
  )
}

type ModalKind = 'create' | 'join' | null

export function MarketPage() {
  const navigate = useNavigate()
  const marketsQuery = useMyMarkets()
  const meQuery = useMyProfile()

  const [tab, setTab] = useState<TabKey>('joined')
  const [keyword, setKeyword] = useState('')

  // 한글 조합 중에는 입력값만 바꾸고, 조합 완료 후 목록 필터에 반영한다.
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const isComposingRef = useRef(false)

  const [modal, setModal] = useState<ModalKind>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [createdMarket, setCreatedMarket] = useState<CreateMarketResponse | null>(null)

  const isHostTab = tab === 'hosted'

  // 재조회 중에는 이전 오류가 남아 있으므로 응답 완료 후 인증 실패를 판정한다.
  // 세션을 비우면 RequireAuth가 로그인 화면으로 이동시킨다.
  useEffect(() => {
    if (meQuery.isFetching) return

    const status = isAxiosError(meQuery.error) ? meQuery.error.response?.status : undefined

    if (status === 401 || status === 403) useSessionStore.getState().clearSession()
  }, [meQuery.error, meQuery.isFetching])

  const isLoading = marketsQuery.isPending || meQuery.isPending
  const isError = marketsQuery.isError || meQuery.isError

  // 개설자도 참여자이므로 전체 목록에는 직접 만든 마켓이 포함된다.
  const myMemberId = meQuery.data?.memberId
  const allMarkets = marketsQuery.data ?? []
  const hostedMarkets = allMarkets.filter((market) => market.hostId === myMemberId)

  const hasAnyMarket = allMarkets.length > 0
  const tabMarkets = isHostTab ? hostedMarkets : allMarkets
  const query = appliedKeyword.trim().toLowerCase()
  const markets = tabMarkets.filter(
    (market) =>
      market.title.toLowerCase().includes(query) ||
      (market.description ?? '').toLowerCase().includes(query),
  )

  function closeModal() {
    setModal(null)
    setIsFormDirty(false)
    setCreatedMarket(null)
    setIsConfirmingClose(false)
  }

  function requestCloseModal() {
    // 생성이 끝난 초대 화면은 입력 내용 폐기 확인 없이 닫을 수 있다.
    if (modal === 'create' && !createdMarket && isFormDirty) {
      setIsConfirmingClose(true)
      return
    }

    closeModal()
  }

  function handleCreated(market: CreateMarketResponse) {
    setCreatedMarket(market)
  }

  function handleJoined(market: JoinMarketResponse) {
    closeModal()
    navigate(`/market/${market.marketId}`, { viewTransition: true })
  }

  function retry() {
    void marketsQuery.refetch()
    void meQuery.refetch()
  }

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-8 md:px-14 lg:px-24">
        <div className="relative overflow-hidden rounded-2xl bg-[image:var(--gradient-dreamy)] px-5 py-6 sm:min-h-72 sm:rounded-3xl sm:p-8 lg:min-h-80 lg:p-10">
          <h1 className="max-w-[calc(100%-4.5rem)] text-head-03 font-bold leading-snug text-text-strong sm:mt-6 sm:max-w-[60%] sm:text-head-01 sm:leading-normal lg:mt-8 lg:text-4xl">
            친구들과 여는
            <br />
            우리들만의 비밀 마켓
          </h1>

          <div className="relative z-10 mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <button
              type="button"
              onClick={() => setModal('create')}
              style={{ clipPath: pixelBox(4) }}
              className="h-10 bg-primary px-3 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-primary/90 sm:h-11 sm:px-5 sm:text-body-04"
            >
              + 플리마켓 만들기
            </button>
            <button
              type="button"
              onClick={() => setModal('join')}
              style={{ clipPath: pixelBox(4) }}
              className="group h-10 bg-primary-tint p-[2px] sm:h-11"
            >
              <span
                style={{ clipPath: pixelBox(4) }}
                className="flex h-full items-center justify-center bg-primary-subtle px-3 text-[13px] font-bold text-text-strong transition-colors duration-200 group-hover:bg-white sm:px-5 sm:text-body-04"
              >
                초대 링크로 참여하기
              </span>
            </button>
          </div>

          <div className="absolute right-6 top-24 hidden max-w-56 rounded-2xl bg-bg px-4 py-3 text-body-04 text-text-muted shadow-md sm:block lg:right-8 lg:top-28">
            친구들과 함께 마켓을 열어보세요!
            <span className="absolute -bottom-1.5 left-8 size-3 rotate-45 bg-bg shadow-md" />
          </div>
          <div className="absolute bottom-4 right-6 hidden h-3 w-20 rounded-full bg-black/15 blur-md sm:block lg:right-14 lg:w-24" />
          <img
            draggable={false}
            src="/mascot/flea.png"
            alt=""
            className="absolute right-4 top-4 size-16 object-contain [image-rendering:pixelated] sm:bottom-4 sm:right-6 sm:top-auto sm:size-28 lg:right-10 lg:size-32"
          />
        </div>

        {isLoading ? (
          <LoadingScreen fullScreen={false} message="마켓을 불러오는 중이에요" />
        ) : isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
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
                    setAppliedKeyword('')
                  }}
                  style={{ clipPath: pixelBox() }}
                  className={`mr-1.5 mt-5 h-8 px-2.5 text-[13px] font-semibold sm:mr-2 sm:mt-8 sm:h-10 sm:px-4 sm:text-body-04 transition-colors duration-200 ${
                    active
                      ? 'bg-primary text-white hover:bg-primary/90'
                      : 'bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong'
                  }`}
                >
                  {label}
                </button>
              )
            })}

            {!isHostTab && tabMarkets.length > 0 && (
              <label className="mt-3 flex w-3/4 max-w-md items-center gap-2 rounded-full bg-primary-subtle px-3.5 py-2 sm:mt-5 sm:w-full sm:px-5 sm:py-3 focus-within:ring-2 focus-within:ring-primary-tint">
                <svg
                  viewBox="0 0 24 24"
                  className="size-4 shrink-0 text-text-muted sm:size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value)
                    if (!isComposingRef.current) setAppliedKeyword(e.target.value)
                  }}
                  onCompositionStart={() => {
                    isComposingRef.current = true
                  }}
                  onCompositionEnd={(e) => {
                    isComposingRef.current = false
                    setAppliedKeyword(e.currentTarget.value)
                  }}
                  placeholder={
                    isHostTab
                      ? '내가 만든 마켓 이름이나 설명으로 검색'
                      : '참여 중인 마켓 이름이나 설명으로 검색'
                  }
                  aria-label={isHostTab ? '내가 만든 마켓 검색' : '참여 중인 마켓 검색'}
                  className="w-full text-ellipsis bg-transparent text-body-03 text-text-strong outline-none placeholder:text-body-04 placeholder:text-text-muted/50 sm:placeholder:text-body-03"
                />
              </label>
            )}

            <div className="mt-6 flex flex-col items-start gap-10">
              {markets.map((market) => (
                <MarketCard
                  key={market.marketId}
                  market={market}
                  isHost={market.hostId === myMemberId}
                />
              ))}

              {tabMarkets.length === 0 && (
                <EmptyState image="/mascot/flea4.png" {...TAB_EMPTY[tab]} />
              )}
              {tabMarkets.length > 0 && markets.length === 0 && (
                <p className="w-full py-12 text-center text-body-03 text-text-muted">
                  '{appliedKeyword.trim()}'에 맞는 마켓이 없어요
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

        <PixelShops className="mt-16 justify-end pr-4" />
        <div
          className="h-6 rounded-md border-t-4 border-primary-tint"
          style={{
            background:
              'repeating-linear-gradient(90deg, var(--color-primary-subtle) 0 46px, var(--color-primary-tint) 46px 48px)',
          }}
        />
      </div>

      <Modal
        open={modal !== null}
        onRequestClose={requestCloseModal}
        labelledBy="market-modal-title"
      >
        {modal === 'join' && (
          <>
            <h2 id="market-modal-title" className="text-head-03 font-bold text-text-strong">
              초대 링크로 참여하기
            </h2>
            <p className="mt-1 text-body-04 text-text-muted">
              친구에게 받은 초대 링크나 코드를 붙여 넣어 주세요.
            </p>
            <img
              draggable={false}
              src={MASCOTS.wink}
              alt=""
              className="mx-auto my-6 h-20 object-contain [image-rendering:pixelated]"
            />
            <JoinMarketForm onJoined={handleJoined} />
          </>
        )}

        {/* 생성 후 동일한 모달에서 초대 링크를 표시한다. */}
        {modal === 'create' &&
          (createdMarket ? (
            <InviteLinkContent
              titleId="market-modal-title"
              marketTitle={createdMarket.title}
              inviteCode={createdMarket.inviteCode}
            />
          ) : (
            <>
              <h2 id="market-modal-title" className="text-head-03 font-bold text-text-strong">
                플리마켓 만들기
              </h2>
              <p className="mt-1 text-body-04 text-text-muted">
                마켓을 만들면 친구들에게 보낼 초대 링크가 생겨요.
              </p>
              <div className="mt-6">
                <CreateMarketForm onCreated={handleCreated} onDirtyChange={setIsFormDirty} />
              </div>
            </>
          ))}

        {/* 확인을 취소해도 입력값이 유지되도록 폼을 마운트한 채 덮는다. */}
        {isConfirmingClose && (
          <div
            // transform이 적용된 dialog를 기준으로 덮도록 absolute를 사용한다.
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-6"
            onClick={() => setIsConfirmingClose(false)}
          >
            <div
              role="alertdialog"
              aria-labelledby="close-confirm-title"
              onClick={(event) => event.stopPropagation()}
              style={{ clipPath: pixelBox(6) }}
              className="w-[min(360px,100%)] bg-bg p-7 text-center"
            >
              <img
                draggable={false}
                src={MASCOTS.surprised}
                alt=""
                className="mx-auto h-16 object-contain [image-rendering:pixelated]"
              />
              <p id="close-confirm-title" className="mt-4 text-body-02 font-bold text-text-strong">
                작성 중인 내용이 사라져요
              </p>
              <p className="mt-1 text-body-04 text-text-muted">
                지금 닫으면 입력한 내용이 저장되지 않아요.
              </p>
              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingClose(false)}
                  style={{ clipPath: pixelBox(4) }}
                  className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                >
                  계속 작성
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ clipPath: pixelBox(4) }}
                  className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
