import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { TRADE_TYPE_LABEL } from '../../../entities/product'
import type { TradeType } from '../../../entities/product'
import {
  useMyTradeRequests,
  type MyTradeRequest,
  type TradeRequestKind,
  type TradeRequestStatus,
} from '../../../entities/trade'
import {
  availableActions,
  getTradeActionErrorMessage,
  useTradeAction,
  type TradeAction,
} from '../../../features/trade-action'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Photo } from '../../../shared/ui/photo'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { useToastStore } from '../../../shared/ui/toast'

// URL에 페이지 번호를 저장해 상세 화면에서 돌아왔을 때 같은 위치를 복원한다.
const PAGE_SIZE = 8

type TabKey = 'received' | 'sent' | 'ongoing' | 'past'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'received', label: '받은 요청' },
  { key: 'sent', label: '보낸 요청' },
  { key: 'ongoing', label: '진행 중' },
  { key: 'past', label: '지난 거래' },
]

const SOURCE_LABEL: Record<TradeRequestKind, string> = {
  ITEM: '마켓',
  COLLECTION: '도감',
  BEG: '도감',
}

// 도감 거래는 대여·교환을 사용하고 구걸 요청에는 tradeType이 없다.
const COLLECTION_TRADE_LABEL: Record<string, string> = { RENTAL: '대여', EXCHANGE: '교환' }

function requestLabel({ requestType, tradeType }: MyTradeRequest) {
  if (requestType === 'BEG') return '구걸'
  if (requestType === 'COLLECTION')
    return tradeType ? (COLLECTION_TRADE_LABEL[tradeType] ?? '거래') : '거래'

  return tradeType ? TRADE_TYPE_LABEL[tradeType as TradeType] : '거래'
}

// 요청 종류마다 ID가 중복될 수 있으므로 종류와 ID를 함께 식별자로 사용한다.
function requestKeyOf({ requestType, requestId }: MyTradeRequest) {
  return `${requestType}:${requestId}`
}

// 물건 삭제·마켓 탈퇴 후에도 조회할 수 있는 거래 요청 상세로 이동한다.
function targetLink({ requestType, requestId }: MyTradeRequest) {
  return `/trade-requests/${requestType}/${requestId}`
}

const ACTION_UI: Record<TradeAction, { label: string; toast: string; primary: boolean }> = {
  accept: { label: '요청 수락', toast: '거래 요청을 수락했어요', primary: true },
  reject: { label: '거절', toast: '거래 요청을 거절했어요', primary: false },
  cancel: { label: '요청 취소', toast: '거래 요청을 취소했어요', primary: false },
  complete: { label: '거래 완료', toast: '거래를 마쳤어요', primary: true },
}

function isRental({ tradeType }: MyTradeRequest) {
  return tradeType === 'RENTAL'
}

// 대여 완료는 요청자의 반납 확인이므로 별도 문구를 사용한다.
const RENTAL_ACTION_UI: Partial<Record<TradeAction, { label: string; toast: string }>> = {
  complete: { label: '반납 확인', toast: '반납을 확인했어요' },
}

function actionUi(request: MyTradeRequest, action: TradeAction) {
  const base = ACTION_UI[action]
  const override = isRental(request) ? RENTAL_ACTION_UI[action] : undefined

  return { ...base, ...override }
}

type SourceKey = 'ALL' | 'ITEM' | 'DEX'

const SOURCES: { key: SourceKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ITEM', label: '마켓' },
  { key: 'DEX', label: '도감' },
]

function readTab(value: string | null): TabKey {
  return TABS.some(({ key }) => key === value) ? (value as TabKey) : 'received'
}

function readSource(value: string | null): SourceKey {
  return SOURCES.some(({ key }) => key === value) ? (value as SourceKey) : 'ALL'
}

function readPage(value: string | null) {
  return value !== null && /^\d+$/.test(value) ? Number(value) : 0
}

function writeTradeListParams(
  params: URLSearchParams,
  tab: TabKey,
  source: SourceKey,
  page: number,
) {
  // 기본값은 URL에서 생략하고 다른 마이페이지 검색 조건은 유지한다.
  if (tab === 'received') params.delete('tradeTab')
  else params.set('tradeTab', tab)

  if (source === 'ALL') params.delete('tradeSource')
  else params.set('tradeSource', source)

  if (page === 0) params.delete('tradePage')
  else params.set('tradePage', String(page))
}

// 도감 출처에는 일반 도감 거래와 구걸 요청을 함께 포함한다.
function matchesSource({ requestType }: MyTradeRequest, source: SourceKey) {
  if (source === 'ALL') return true
  if (source === 'ITEM') return requestType === 'ITEM'

  return requestType === 'COLLECTION' || requestType === 'BEG'
}

const STATUS_LABEL: Record<TradeRequestStatus, string> = {
  PENDING: '수락 대기',
  ACCEPTED: '거래 중',
  COMPLETED: '거래 완료',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
}

// 내 응답이 필요한 요청만 강조색으로 구분한다.
const NEEDS_ME_TONE = 'bg-primary text-white'

const STATUS_TONE: Record<TradeRequestStatus, string> = {
  PENDING: 'bg-primary-subtle text-text-muted',
  ACCEPTED: 'bg-primary-tint text-text-muted',
  COMPLETED: 'bg-bg-subtle text-text-muted',
  REJECTED: 'bg-bg-subtle text-text-muted',
  CANCELLED: 'bg-bg-subtle text-text-muted',
}

const EMPTY_STATE: Record<TabKey, { title: string; description: string }> = {
  received: {
    title: '아직 받은 요청이 없어요',
    description: '마켓에 올린 내 물건에 요청이 오면\n이곳에서 확인할 수 있어요.',
  },
  sent: {
    title: '아직 보낸 요청이 없어요',
    description: '마켓에서 마음에 드는 물건을 찾아\n거래를 요청해 보세요.',
  },
  ongoing: {
    title: '진행 중인 거래가 없어요',
    description: '서로 수락한 거래를\n여기에서 이어갈 수 있어요.',
  },
  past: {
    title: '아직 지난 거래가 없어요',
    description: '거래가 끝나면 완료한 거래와\n거절·취소한 요청이 여기에 남아요.',
  },
}

const FOCUS_STYLE =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'
const PRIMARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS_STYLE}`
const SECONDARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary-subtle px-4 text-body-04 text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50 ${FOCUS_STYLE}`

const ROW_PRIMARY = `inline-flex h-8 items-center whitespace-nowrap bg-primary px-3 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS_STYLE}`
const ROW_SECONDARY = `inline-flex h-8 items-center whitespace-nowrap bg-primary-subtle px-3 text-xs font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50 ${FOCUS_STYLE}`

function matchesTab(request: MyTradeRequest, tab: TabKey) {
  const { status, isRequester } = request

  if (tab === 'received') return status === 'PENDING' && !isRequester
  if (tab === 'sent') return status === 'PENDING' && isRequester
  if (tab === 'ongoing') return status === 'ACCEPTED'

  return status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED'
}

// 요청자 여부에 따라 상대방과 대여 방향을 구분한다.
function describe(request: MyTradeRequest) {
  const { status, isRequester, owner, requester } = request
  const who = (isRequester ? owner : requester).nickname

  if (status === 'PENDING') return isRequester ? `${who}님에게 요청했어요` : `${who}님이 요청했어요`

  if (status === 'ACCEPTED') {
    if (isRental(request)) return isRequester ? `${who}님에게 빌렸어요` : `${who}님에게 빌려줬어요`

    return `${who}님과 거래 중이에요`
  }

  if (status === 'COMPLETED') {
    if (isRental(request))
      return isRequester ? `${who}님에게 빌렸다 돌려줬어요` : `${who}님이 돌려줬어요`

    return `${who}님과 거래를 마쳤어요`
  }

  if (status === 'REJECTED') return isRequester ? `${who}님이 거절했어요` : '거절한 요청이에요'

  return isRequester ? '요청을 취소했어요' : `${who}님이 취소했어요`
}

// 대여의 진행·완료 상태만 별도 문구를 쓰고 거절·취소 문구는 공통으로 사용한다.
function statusLabel(request: MyTradeRequest) {
  if (isRental(request)) {
    if (request.status === 'ACCEPTED') return '대여 중'
    if (request.status === 'COMPLETED') return '대여 완료'
  }

  return STATUS_LABEL[request.status]
}

function ItemPhoto({ imageUrl }: { imageUrl: string | null }) {
  return (
    <span
      style={{ clipPath: pixelBox(3) }}
      className="size-16 shrink-0 bg-primary-tint p-[2px] sm:size-20"
    >
      <span
        style={{ clipPath: pixelBox(2) }}
        className="relative grid size-full place-items-center overflow-hidden bg-primary-subtle"
      >
        <Photo
          src={imageUrl}
          fallback={MASCOTS.default}
          className="size-full object-cover"
          fallbackClassName="h-2/3"
        />
      </span>
    </span>
  )
}

export function MyTradeList() {
  const tabsId = useId()
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({})

  const [searchParams, setSearchParams] = useSearchParams()
  const tab = readTab(searchParams.get('tradeTab'))
  const source = readSource(searchParams.get('tradeSource'))
  const page = readPage(searchParams.get('tradePage'))

  const [sourceOpen, setSourceOpen] = useState(false)
  const sourceMenuRef = useRef<HTMLDivElement>(null)

  // ref로 재렌더 전 중복 요청을 막고 state로 버튼의 처리 상태를 표시한다.
  const pendingKeysRef = useRef(new Set<string>())
  const [pendingRequests, setPendingRequests] = useState<Record<string, TradeAction>>({})

  // 처리 직후 행이 사라져 목록 위치가 바뀌지 않도록 필터 전환 전까지 유지한다.
  const [justHandled, setJustHandled] = useState<string[]>([])
  const [error, setError] = useState('')

  const requestsQuery = useMyTradeRequests()
  const action = useTradeAction()

  const requests = requestsQuery.data ?? []
  const inSource = requests.filter((request) => matchesSource(request, source))
  const visible = inSource.filter(
    (request) => matchesTab(request, tab) || justHandled.includes(requestKeyOf(request)),
  )
  const visibleSourceCount = inSource.length

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount - 1)
  const pageItems = visible.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)

  const counts = Object.fromEntries(
    TABS.map(({ key }) => [key, inSource.filter((request) => matchesTab(request, key)).length]),
  ) as Record<TabKey, number>

  // 요청 처리로 페이지 수가 줄었을 때는 보정된 페이지를 복귀 주소에 저장한다.
  const returnParams = new URLSearchParams(searchParams)
  writeTradeListParams(returnParams, tab, source, currentPage)

  const returnQuery = returnParams.toString()
  const returnToMyPage = returnQuery ? `/my-page?${returnQuery}` : '/my-page'

  function updateListLocation(next: Partial<{ tab: TabKey; source: SourceKey; page: number }>) {
    const params = new URLSearchParams(searchParams)
    writeTradeListParams(params, next.tab ?? tab, next.source ?? source, next.page ?? page)
    setSearchParams(params, { replace: true, preventScrollReset: true })
  }

  useEffect(() => {
    if (!sourceOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (!sourceMenuRef.current?.contains(event.target as Node)) setSourceOpen(false)
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setSourceOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [sourceOpen])

  function selectTab(nextTab: TabKey) {
    updateListLocation({ tab: nextTab, page: 0 })

    // 이전 탭에서 임시로 유지한 행과 오류를 초기화한다.
    setJustHandled([])
    setError('')
    tabRefs.current[nextTab]?.focus()
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentTab: TabKey) {
    const index = TABS.findIndex(({ key }) => key === currentTab)
    let nextIndex: number

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    else return

    event.preventDefault()
    selectTab(TABS[nextIndex].key)
  }

  async function run(request: MyTradeRequest, actionType: TradeAction) {
    const requestKey = requestKeyOf(request)
    if (pendingKeysRef.current.has(requestKey)) return

    pendingKeysRef.current.add(requestKey)
    setError('')
    setPendingRequests((current) => ({ ...current, [requestKey]: actionType }))

    try {
      await action.mutateAsync({
        kind: request.requestType,
        requestId: request.requestId,
        action: actionType,
      })
      setJustHandled((current) =>
        current.includes(requestKey) ? current : [...current, requestKey],
      )
      useToastStore.getState().showToast(actionUi(request, actionType).toast)
    } catch (actionError) {
      setError(getTradeActionErrorMessage(actionError, actionType))
    } finally {
      pendingKeysRef.current.delete(requestKey)
      setPendingRequests((current) => {
        const next = { ...current }
        delete next[requestKey]

        return next
      })
    }
  }

  return (
    <section
      aria-labelledby={`${tabsId}-heading`}
      style={{ clipPath: pixelBox(6) }}
      className="min-w-0 bg-primary-tint p-[2px]"
    >
      <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-4 sm:p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <h2 id={`${tabsId}-heading`} className="text-head-03 font-bold text-text-strong">
              내 거래
            </h2>
            {!requestsQuery.isPending && !requestsQuery.isError && (
              <div ref={sourceMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSourceOpen((open) => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={sourceOpen}
                  className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs text-text-muted transition-colors hover:bg-primary-subtle hover:text-text-strong ${FOCUS_STYLE}`}
                >
                  {SOURCES.find(({ key }) => key === source)?.label} {visibleSourceCount}건
                  <span
                    aria-hidden="true"
                    className={`transition-transform ${sourceOpen ? 'rotate-180' : ''}`}
                  >
                    ⌄
                  </span>
                </button>

                {sourceOpen && (
                  <ul
                    role="listbox"
                    aria-label="거래 출처"
                    className="glass-panel absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-2xl py-1"
                  >
                    {SOURCES.map(({ key, label }) => {
                      const selected = source === key
                      const count =
                        key === 'ALL'
                          ? requests.length
                          : requests.filter((request) => matchesSource(request, key)).length

                      return (
                        <li key={key}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              updateListLocation({ source: key, page: 0 })
                              setJustHandled([])
                              setError('')
                              setSourceOpen(false)
                            }}
                            className={`flex min-h-10 w-full items-center justify-between px-3 text-left text-body-04 transition-colors hover:bg-glass-strong ${
                              selected ? 'font-bold text-glass-ink/92' : 'text-glass-ink/58'
                            } ${FOCUS_STYLE}`}
                          >
                            {label}
                            <span className="text-xs text-glass-ink/58">{count}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          role="tablist"
          aria-label="거래 상태"
          style={{ clipPath: pixelBox(4) }}
          className="grid grid-cols-4 gap-1 bg-primary-subtle p-1"
        >
          {TABS.map(({ key, label }) => {
            const active = tab === key

            return (
              <button
                key={key}
                ref={(node) => {
                  tabRefs.current[key] = node
                }}
                id={`${tabsId}-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`${tabsId}-panel-${key}`}
                tabIndex={active ? 0 : -1}
                onKeyDown={(event) => handleTabKeyDown(event, key)}
                onClick={() => selectTab(key)}
                style={{ clipPath: pixelBox(3) }}
                className={`flex min-h-12 min-w-0 flex-col items-center justify-center sm:flex-row gap-x-1.5 gap-y-0.5 px-1 py-2 text-xs transition-colors sm:px-2 sm:text-body-04 ${
                  active
                    ? 'bg-bg font-bold text-text-strong'
                    : 'text-text-muted hover:bg-primary-tint/50'
                } ${FOCUS_STYLE}`}
              >
                <span className="whitespace-nowrap">{label}</span>
                <span
                  style={{ clipPath: pixelBox(2) }}
                  className={`min-w-5 px-1 py-0.5 text-[11px] leading-4 ${active ? 'bg-primary-tint text-text-strong' : 'text-text-muted'}`}
                >
                  {requestsQuery.isPending || requestsQuery.isError ? '–' : counts[key]}
                </span>
              </button>
            )
          })}
        </div>

        {error && (
          <div
            role="alert"
            style={{ clipPath: pixelBox(3) }}
            className="mt-4 flex items-start gap-2 bg-primary-subtle p-3 text-body-04 text-text-strong"
          >
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="mt-0.5 h-5 shrink-0 object-contain [image-rendering:pixelated]"
            />
            <p>{error}</p>
          </div>
        )}
        <p role="status" className="sr-only">
          {Object.keys(pendingRequests).length > 0 ? '거래 요청을 처리하는 중이에요.' : ''}
        </p>

        {TABS.filter(({ key }) => key !== tab).map(({ key }) => (
          <div
            key={key}
            id={`${tabsId}-panel-${key}`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${key}`}
            hidden
          />
        ))}
        <div
          id={`${tabsId}-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`${tabsId}-tab-${tab}`}
          tabIndex={0}
          className={`mt-5 min-h-80 ${FOCUS_STYLE}`}
        >
          {requestsQuery.isPending ? (
            <div className="space-y-3 py-2">
              <p role="status" className="sr-only">
                거래 내역을 불러오는 중이에요.
              </p>
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  aria-hidden="true"
                  className="flex gap-4 border-b border-primary-subtle py-5 motion-safe:animate-pulse"
                >
                  <span
                    style={{ clipPath: pixelBox(3) }}
                    className="size-16 shrink-0 bg-primary-subtle"
                  />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-2/3 bg-primary-subtle" />
                    <div className="h-3 w-1/2 bg-primary-subtle" />
                  </div>
                </div>
              ))}
            </div>
          ) : requestsQuery.isError ? (
            <div className="flex flex-col items-center px-4 py-12 text-center sm:py-16">
              <img
                draggable={false}
                src={MASCOTS.surprised}
                alt=""
                className="h-16 object-contain [image-rendering:pixelated]"
              />
              <p role="alert" className="mt-4 text-body-03 font-bold text-text-strong">
                거래 내역을 불러오지 못했어요
              </p>
              <p className="mt-2 text-body-04 text-text-muted">잠시 후 다시 불러와 주세요.</p>
              <button
                type="button"
                onClick={() => void requestsQuery.refetch()}
                disabled={requestsQuery.isFetching}
                style={{ clipPath: pixelBox(4) }}
                className={`mt-6 ${SECONDARY_ACTION}`}
              >
                {requestsQuery.isFetching ? '다시 불러오는 중...' : '다시 불러오기'}
              </button>
            </div>
          ) : (
            <>
              {visible.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center px-3 py-10 text-center sm:min-h-80 sm:py-12">
                  <img
                    draggable={false}
                    src={MASCOTS.basket}
                    alt=""
                    className="h-20 object-contain [image-rendering:pixelated]"
                  />
                  <p className="mt-5 text-balance text-body-03 font-bold text-text-strong">
                    {EMPTY_STATE[tab].title}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-body-04 leading-relaxed text-text-muted">
                    {EMPTY_STATE[tab].description}
                  </p>
                  {tab === 'ongoing' && counts.received > 0 ? (
                    <button
                      type="button"
                      onClick={() => selectTab('received')}
                      style={{ clipPath: pixelBox(4) }}
                      className={`mt-6 ${PRIMARY_ACTION}`}
                    >
                      받은 요청 확인하기{' '}
                      <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                    </button>
                  ) : tab !== 'past' ? (
                    <Link
                      to="/market"
                      viewTransition
                      style={{ clipPath: pixelBox(4) }}
                      className={`mt-6 ${SECONDARY_ACTION}`}
                    >
                      마켓 둘러보기 <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                    </Link>
                  ) : null}
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-primary-tint/60">
                  {pageItems.map((request) => {
                    const { status, isRequester, requestType, targetItemTitle, imageUrl } = request
                    const requestKey = requestKeyOf(request)
                    const pendingAction = pendingRequests[requestKey]
                    const busy = pendingAction !== undefined
                    const actions = availableActions(request)
                    const needsMyAction = status === 'PENDING' && !isRequester

                    return (
                      <li
                        key={`${requestType}-${request.requestId}`}
                        data-trade-request-id={request.requestId}
                        aria-busy={busy}
                        className="relative min-h-28 px-2 py-4 transition-colors hover:bg-primary-subtle/40 sm:min-h-32"
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <ItemPhoto imageUrl={imageUrl} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-text-muted">
                                {SOURCE_LABEL[requestType]} · {requestLabel(request)}
                              </p>
                              {/* 받은 요청 탭은 탭 자체가 응답 대기 상태를 나타내므로 배지를 생략한다. */}
                              {tab !== 'received' && (
                                <span
                                  style={{ clipPath: pixelBox(2) }}
                                  className={`shrink-0 whitespace-nowrap px-2 py-1 text-[11px] leading-4 font-semibold ${
                                    needsMyAction ? NEEDS_ME_TONE : STATUS_TONE[status]
                                  }`}
                                >
                                  {needsMyAction ? '응답 필요' : statusLabel(request)}
                                </span>
                              )}
                            </div>

                            <Link
                              to={targetLink(request)}
                              state={{ from: { to: returnToMyPage, label: '마이페이지' } }}
                              viewTransition
                              title={targetItemTitle}
                              className={`mt-1 block truncate text-body-03 font-bold text-text-strong after:absolute after:inset-0 after:content-[''] ${FOCUS_STYLE}`}
                            >
                              {targetItemTitle}
                            </Link>

                            <div className="mt-1.5 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                              <p
                                title={describe(request)}
                                className="min-w-0 flex-1 truncate text-body-04 text-text-muted"
                              >
                                {describe(request)}
                              </p>
                              <div className="relative z-10 flex shrink-0 items-center gap-1.5">
                                {actions.map((actionType) => (
                                  <button
                                    key={actionType}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void run(request, actionType)}
                                    style={{ clipPath: pixelBox(2) }}
                                    className={
                                      actionUi(request, actionType).primary
                                        ? ROW_PRIMARY
                                        : ROW_SECONDARY
                                    }
                                  >
                                    {busy && pendingAction === actionType
                                      ? '처리 중'
                                      : actionUi(request, actionType).label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {status === 'ACCEPTED' && actions.length === 0 && (
                              <p className="mt-1.5 text-xs text-text-muted">
                                {isRental(request)
                                  ? '상대방의 반납 확인을 기다리고 있어요.'
                                  : '상대방의 거래 완료를 기다리고 있어요.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {pageCount > 1 && (
                <nav
                  aria-label="거래 목록 페이지"
                  className="mt-4 flex flex-wrap justify-center gap-1.5 border-t border-primary-subtle pt-4"
                >
                  {Array.from({ length: pageCount }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => updateListLocation({ page: index })}
                      aria-label={`${index + 1}페이지`}
                      aria-current={currentPage === index ? 'page' : undefined}
                      style={{ clipPath: pixelBox(2) }}
                      className={
                        currentPage === index
                          ? `size-8 bg-primary text-body-04 font-bold text-white ${FOCUS_STYLE}`
                          : `size-8 bg-primary-subtle text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong ${FOCUS_STYLE}`
                      }
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
