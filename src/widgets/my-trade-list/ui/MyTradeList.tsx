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

// 거래 기록은 계속 쌓이므로 한 번에 다 펼치지 않고 끊어 보여준다.
// 무한 스크롤 대신 페이지 번호를 쓰는 이유 — 기록은 "훑는" 것이 아니라 "찾는" 대상이라
// 몇 번째 장에 있었는지 기억하고 되돌아갈 수 있어야 한다 (도감 화면과 같은 방식)
const PAGE_SIZE = 8

type TabKey = 'received' | 'sent' | 'ongoing' | 'past'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'received', label: '받은 요청' },
  { key: 'sent', label: '보낸 요청' },
  { key: 'ongoing', label: '진행 중' },
  // 완료·거절·취소를 한 칸에 모은다. 끝난 요청이 화면에서 통째로 사라지면 왜 없어졌는지 알 수 없다
  { key: 'past', label: '지난 거래' },
]

// 어디에서 온 요청인지. 마켓 상품과 도감 물건은 이동할 화면도 다르다
const SOURCE_LABEL: Record<TradeRequestKind, string> = {
  ITEM: '마켓',
  COLLECTION: '도감',
  BEG: '도감',
}

// 무슨 요청인지. 상품은 SALE·GIVEAWAY·RENTAL, 도감 거래는 RENTAL·EXCHANGE, 구걸은 tradeType이 없다
const COLLECTION_TRADE_LABEL: Record<string, string> = { RENTAL: '대여', EXCHANGE: '교환' }

function requestLabel({ requestType, tradeType }: MyTradeRequest) {
  if (requestType === 'BEG') return '구걸'
  if (requestType === 'COLLECTION') return tradeType ? COLLECTION_TRADE_LABEL[tradeType] ?? '거래' : '거래'
  return tradeType ? TRADE_TYPE_LABEL[tradeType as TradeType] : '거래'
}

// 상품은 상품 상세로, 도감 물건(거래·구걸)은 도감 물건 상세로 보낸다
// 종류가 다르면 requestId가 겹칠 수 있어 둘을 합쳐 한 줄을 가리킨다
function requestKeyOf({ requestType, requestId }: MyTradeRequest) {
  return `${requestType}:${requestId}`
}

// 물건 상세가 아니라 거래 요청 상세로 보낸다. 물건 쪽은 지워졌거나 마켓을 나갔으면
// 404·403이 나고, 대여 기간이나 요청할 때 쓴 말처럼 요청에만 있는 값도 보이지 않는다
function targetLink({ requestType, requestId }: MyTradeRequest) {
  return `/trade-requests/${requestType}/${requestId}`
}

const ACTION_UI: Record<TradeAction, { label: string; toast: string; primary: boolean }> = {
  accept: { label: '요청 수락', toast: '거래 요청을 수락했어요', primary: true },
  reject: { label: '거절', toast: '거래 요청을 거절했어요', primary: false },
  cancel: { label: '요청 취소', toast: '거래 요청을 취소했어요', primary: false },
  complete: { label: '거래 완료', toast: '거래를 마쳤어요', primary: true },
}

// 마켓 상품과 도감 물건 거래가 한 목록에 섞여 오므로, 보고 싶은 쪽만 추릴 수 있게 한다
type SourceKey = 'ALL' | 'ITEM' | 'DEX'

const SOURCES: { key: SourceKey; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'ITEM', label: '마켓' },
  { key: 'DEX', label: '도감' },
]

function readTab(value: string | null): TabKey {
  return TABS.some(({ key }) => key === value) ? value as TabKey : 'received'
}

function readSource(value: string | null): SourceKey {
  return SOURCES.some(({ key }) => key === value) ? value as SourceKey : 'ALL'
}

function readPage(value: string | null) {
  return value !== null && /^\d+$/.test(value) ? Number(value) : 0
}

function writeTradeListParams(params: URLSearchParams, tab: TabKey, source: SourceKey, page: number) {
  if (tab === 'received') params.delete('tradeTab')
  else params.set('tradeTab', tab)

  if (source === 'ALL') params.delete('tradeSource')
  else params.set('tradeSource', source)

  if (page === 0) params.delete('tradePage')
  else params.set('tradePage', String(page))
}

// 도감 거래와 구걸은 둘 다 도감 물건에 대한 요청이라 한 갈래로 묶는다
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

// 배지는 하나만 소리를 낸다. 내가 답해야 하는 요청만 보라로 채우고 흰 글자를 얹어 눈에 걸리게 하고,
// 나머지(기다리는 중·끝난 거래)는 색을 죽인다 (디자인 규칙 4)
const NEEDS_ME_TONE = 'bg-primary text-white'

const STATUS_TONE: Record<TradeRequestStatus, string> = {
  PENDING: 'bg-primary-subtle text-text-muted',
  ACCEPTED: 'bg-primary-tint text-text-muted',
  COMPLETED: 'bg-bg-subtle text-text-muted',
  REJECTED: 'bg-bg-subtle text-text-muted',
  CANCELLED: 'bg-bg-subtle text-text-muted',
}

// 안내 문구는 줄 나눌 자리를 직접 정한다. 브라우저에 맡기면 마지막 줄에
// 몇 글자만 남아 어색해진다. 줄바꿈은 whitespace-pre-line으로 그대로 살린다
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

const FOCUS_STYLE = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'
const PRIMARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS_STYLE}`
const SECONDARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary-subtle px-4 text-body-04 text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50 ${FOCUS_STYLE}`
// 줄 안에 들어가는 버튼은 목록을 밀어내지 않도록 작게 (탭 영역은 32px 유지)
const ROW_PRIMARY = `inline-flex h-8 items-center whitespace-nowrap bg-primary px-3 text-xs font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-50 ${FOCUS_STYLE}`
const ROW_SECONDARY = `inline-flex h-8 items-center whitespace-nowrap bg-primary-subtle px-3 text-xs font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50 ${FOCUS_STYLE}`

function matchesTab(request: MyTradeRequest, tab: TabKey) {
  const { status, isRequester } = request
  if (tab === 'received') return status === 'PENDING' && !isRequester
  if (tab === 'sent') return status === 'PENDING' && isRequester
  if (tab === 'ongoing') return status === 'ACCEPTED'
  return status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED'
}

// 상대가 누구이고 지금 무슨 상황인지를 한 줄로. 상태마다 주어가 달라 문장을 따로 쓴다
function describe({ status, isRequester, owner, requester }: MyTradeRequest) {
  // 통합 목록은 양쪽을 다 주므로, 내가 아닌 쪽이 상대다
  const who = (isRequester ? owner : requester).nickname
  if (status === 'PENDING') return isRequester ? `${who}님에게 요청했어요` : `${who}님이 요청했어요`
  if (status === 'ACCEPTED') return `${who}님과 거래 중이에요`
  if (status === 'COMPLETED') return `${who}님과 거래를 마쳤어요`
  if (status === 'REJECTED') return isRequester ? `${who}님이 거절했어요` : '거절한 요청이에요'
  return isRequester ? '요청을 취소했어요' : `${who}님이 취소했어요`
}

function ItemPhoto({ imageUrl, status }: { imageUrl: string | null; status: TradeRequestStatus }) {
  const inactive = status === 'ACCEPTED' || status === 'COMPLETED'

  return (
    <span
      style={{ clipPath: pixelBox(3) }}
      className="size-16 shrink-0 bg-primary-tint p-[2px] sm:size-20"
    >
      <span
        style={{ clipPath: pixelBox(2) }}
        className="relative grid size-full place-items-center overflow-hidden bg-primary-subtle"
      >
        <Photo src={imageUrl} fallback={MASCOTS.default} className="size-full object-cover" fallbackClassName="h-2/3" />
        {inactive && (
          <span className="absolute inset-0 grid place-items-center bg-text-strong/55 text-xs font-bold text-white">
            {STATUS_LABEL[status]}
          </span>
        )}
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
  const pendingKeysRef = useRef(new Set<string>())
  const [pendingRequests, setPendingRequests] = useState<Record<string, TradeAction>>({})
  // 방금 처리한 요청. 상태가 바뀌면 다른 탭으로 옮겨가지만, 눈앞에서 바로 빼면
  // 아래 줄들이 한 칸씩 튀어 올라 목록이 들썩인다. 탭을 옮기기 전까지는 자리에 둬서
  // 무엇이 어떻게 바뀌었는지 그 자리에서 확인하게 한다
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
  const returnParams = new URLSearchParams(searchParams)
  writeTradeListParams(returnParams, tab, source, currentPage)
  const returnQuery = returnParams.toString()
  const returnToMyPage = returnQuery ? `/my-page?${returnQuery}` : '/my-page'

  function updateListLocation(next: Partial<{ tab: TabKey; source: SourceKey; page: number }>) {
    const params = new URLSearchParams(searchParams)
    writeTradeListParams(params, next.tab ?? tab, next.source ?? source, next.page ?? page)
    setSearchParams(params, { replace: true, preventScrollReset: true })
  }

  // 바깥을 누르거나 Esc를 누르면 필터 목록을 닫는다
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
    // 탭을 옮기면 붙잡아 두던 줄도 제자리를 찾아간다.
    // 앞선 실패 문구도 그 탭의 이야기라 같이 치운다
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
      await action.mutateAsync({ kind: request.requestType, requestId: request.requestId, action: actionType })
      // 처리한 줄을 자리에 붙잡아 둔다. 목록에서 바로 빼면 아래 줄들이 튀어 오른다
      setJustHandled((current) => current.includes(requestKey) ? current : [...current, requestKey])
      useToastStore.getState().showToast(ACTION_UI[actionType].toast)
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
            <h2 id={`${tabsId}-heading`} className="text-head-03 font-bold text-text-strong">내 거래</h2>
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
                    <span aria-hidden="true" className={`transition-transform ${sourceOpen ? 'rotate-180' : ''}`}>⌄</span>
                  </button>

                  {sourceOpen && (
                    // 잠깐 떴다 사라지는 조작용 판이라 둥근 모서리를 쓰고,
                    // 헤더의 알림·프로필 판과 같은 유리면으로 맞춘다
                    <ul
                      role="listbox"
                      aria-label="거래 출처"
                      className="glass-panel absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-2xl py-1"
                    >
                      {SOURCES.map(({ key, label }) => {
                        const selected = source === key
                        const count = key === 'ALL' ? requests.length : requests.filter((request) => matchesSource(request, key)).length
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
                ref={(node) => { tabRefs.current[key] = node }}
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
                  active ? 'bg-bg font-bold text-text-strong' : 'text-text-muted hover:bg-primary-tint/50'
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
          <div role="alert" style={{ clipPath: pixelBox(3) }} className="mt-4 flex items-start gap-2 bg-primary-subtle p-3 text-body-04 text-text-strong">
            <img src={MASCOTS.surprised} alt="" className="mt-0.5 h-5 shrink-0 object-contain [image-rendering:pixelated]" />
            <p>{error}</p>
          </div>
        )}
        <p role="status" className="sr-only">
          {Object.keys(pendingRequests).length > 0 ? '거래 요청을 처리하는 중이에요.' : ''}
        </p>

        {TABS.filter(({ key }) => key !== tab).map(({ key }) => (
          <div key={key} id={`${tabsId}-panel-${key}`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${key}`} hidden />
        ))}
        <div id={`${tabsId}-panel-${tab}`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${tab}`} tabIndex={0} className={`mt-5 min-h-80 ${FOCUS_STYLE}`}>
          {requestsQuery.isPending ? (
            <div className="space-y-3 py-2">
              <p role="status" className="sr-only">거래 내역을 불러오는 중이에요.</p>
              {[0, 1, 2].map((row) => (
                <div key={row} aria-hidden="true" className="flex gap-4 border-b border-primary-subtle py-5 motion-safe:animate-pulse">
                  <span style={{ clipPath: pixelBox(3) }} className="size-16 shrink-0 bg-primary-subtle" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-2/3 bg-primary-subtle" />
                    <div className="h-3 w-1/2 bg-primary-subtle" />
                  </div>
                </div>
              ))}
            </div>
          ) : requestsQuery.isError ? (
            <div className="flex flex-col items-center px-4 py-12 text-center sm:py-16">
              <img src={MASCOTS.surprised} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
              <p role="alert" className="mt-4 text-body-03 font-bold text-text-strong">거래 내역을 불러오지 못했어요</p>
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
                  <img src={MASCOTS.basket} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                  <p className="mt-5 text-balance text-body-03 font-bold text-text-strong">{EMPTY_STATE[tab].title}</p>
                  <p className="mt-2 whitespace-pre-line text-body-04 leading-relaxed text-text-muted">{EMPTY_STATE[tab].description}</p>
                  {tab === 'ongoing' && counts.received > 0 ? (
                    <button type="button" onClick={() => selectTab('received')} style={{ clipPath: pixelBox(4) }} className={`mt-6 ${PRIMARY_ACTION}`}>
                      받은 요청 확인하기 <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                    </button>
                  ) : tab !== 'past' ? (
                    <Link to="/market" viewTransition style={{ clipPath: pixelBox(4) }} className={`mt-6 ${SECONDARY_ACTION}`}>
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
                          <ItemPhoto imageUrl={imageUrl} status={status} />
                          <div className="min-w-0 flex-1">
                            {/* 출처·종류는 부가 정보라 글자만, 지금 해야 할 일(상태)만 배지로 세운다 */}
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-text-muted">
                                {SOURCE_LABEL[requestType]} · {requestLabel(request)}
                              </p>
                              {/* 받은 요청 탭은 모든 줄이 '응답 필요'라 배지가 탭 이름을 되풀이한다 */}
                              {tab !== 'received' && (
                                <span
                                  style={{ clipPath: pixelBox(2) }}
                                  className={`shrink-0 whitespace-nowrap px-2 py-1 text-[11px] leading-4 font-semibold ${
                                    needsMyAction ? NEEDS_ME_TONE : STATUS_TONE[status]
                                  }`}
                                >
                                  {needsMyAction ? '응답 필요' : STATUS_LABEL[status]}
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

                            {/* 누가 무엇을 했는지와 내가 할 일을 한 줄에 둔다 */}
                            <div className="mt-1.5 flex min-h-8 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                              <p title={describe(request)} className="min-w-0 flex-1 truncate text-body-04 text-text-muted">
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
                                    className={ACTION_UI[actionType].primary ? ROW_PRIMARY : ROW_SECONDARY}
                                  >
                                    {busy && pendingAction === actionType ? '처리 중' : ACTION_UI[actionType].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {status === 'ACCEPTED' && actions.length === 0 && (
                              <p className="mt-1.5 text-xs text-text-muted">상대방의 거래 완료를 기다리고 있어요.</p>
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
