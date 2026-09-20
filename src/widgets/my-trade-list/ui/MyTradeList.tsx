import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'

import { TRADE_TYPE_LABEL } from '../../../entities/product'
import {
  getTradeRequestActionErrorMessage,
  useMyTradeRequests,
  useTradeRequestAction,
  type TradeRequestAction,
  type TradeRequestStatus,
  type TradeRequestSummary,
} from '../../../features/trade-request'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { useToastStore } from '../../../shared/ui/toast'

type TabKey = 'received' | 'sent' | 'ongoing' | 'past'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'received', label: '받은 요청' },
  { key: 'sent', label: '보낸 요청' },
  { key: 'ongoing', label: '진행 중' },
  // 완료·거절·취소를 한 칸에 모은다. 끝난 요청이 화면에서 통째로 사라지면 왜 없어졌는지 알 수 없다
  { key: 'past', label: '지난 거래' },
]

const STATUS_LABEL: Record<TradeRequestStatus, string> = {
  PENDING: '수락 대기',
  ACCEPTED: '거래 중',
  COMPLETED: '거래 완료',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
}

// 끝난 거래는 색을 죽여서 표현한다 (디자인 규칙 4)
const STATUS_TONE: Record<TradeRequestStatus, string> = {
  PENDING: 'bg-primary-subtle text-text-strong',
  ACCEPTED: 'bg-primary-tint text-text-strong',
  COMPLETED: 'bg-bg-subtle text-text-muted',
  REJECTED: 'bg-bg-subtle text-text-muted',
  CANCELLED: 'bg-bg-subtle text-text-muted',
}

const EMPTY_STATE: Record<TabKey, { title: string; description: string }> = {
  received: {
    title: '아직 받은 요청이 없어요',
    description: '마켓에 올린 내 물건에 요청이 오면 이곳에서 확인할 수 있어요.',
  },
  sent: {
    title: '아직 보낸 요청이 없어요',
    description: '마켓에서 마음에 드는 물건을 찾아 거래를 요청해 보세요.',
  },
  ongoing: {
    title: '진행 중인 거래가 없어요',
    description: '서로 수락한 거래를 여기에서 이어갈 수 있어요.',
  },
  past: {
    title: '아직 지난 거래가 없어요',
    description: '거래가 끝나면 완료한 거래와 거절·취소한 요청이 여기에 남아요.',
  },
}

const FOCUS_STYLE = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'
const PRIMARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary-tint disabled:opacity-50 ${FOCUS_STYLE}`
const SECONDARY_ACTION = `inline-flex min-h-11 items-center justify-center gap-2 bg-primary-subtle px-4 text-body-04 text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-50 ${FOCUS_STYLE}`

function matchesTab(request: TradeRequestSummary, tab: TabKey) {
  const { tradeRequestStatus: status, isRequester } = request
  if (tab === 'received') return status === 'PENDING' && !isRequester
  if (tab === 'sent') return status === 'PENDING' && isRequester
  if (tab === 'ongoing') return status === 'ACCEPTED'
  return status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELLED'
}

// 상대가 누구이고 지금 무슨 상황인지를 한 줄로. 상태마다 주어가 달라 문장을 따로 쓴다
function describe({ tradeRequestStatus: status, isRequester, counterparty }: TradeRequestSummary) {
  const who = counterparty.nickname
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
      className="relative grid size-16 shrink-0 place-items-center overflow-hidden bg-primary-subtle sm:size-20"
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" loading="lazy" className={`size-full object-cover ${inactive ? 'blur-[1px]' : ''}`} />
      ) : (
        <img src={MASCOTS.default} alt="" className="h-2/3 object-contain [image-rendering:pixelated]" />
      )}
      {inactive && (
        <span className="absolute inset-0 grid place-items-center bg-text-strong/55 text-xs font-bold text-white">
          {STATUS_LABEL[status]}
        </span>
      )}
    </span>
  )
}

export function MyTradeList() {
  const tabsId = useId()
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({})
  const [tab, setTab] = useState<TabKey>('received')
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [pendingAction, setPendingAction] = useState<TradeRequestAction | null>(null)
  const [error, setError] = useState('')
  const requestsQuery = useMyTradeRequests()
  const action = useTradeRequestAction()

  const requests = requestsQuery.data ?? []
  const visible = requests.filter((request) => matchesTab(request, tab))
  const counts = Object.fromEntries(
    TABS.map(({ key }) => [key, requests.filter((request) => matchesTab(request, key)).length]),
  ) as Record<TabKey, number>

  function selectTab(nextTab: TabKey) {
    setTab(nextTab)
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

  async function run(request: TradeRequestSummary, actionType: TradeRequestAction, doneMessage: string) {
    if (pendingId !== null) return
    setError('')
    setPendingId(request.tradeRequestId)
    setPendingAction(actionType)
    try {
      await action.mutateAsync({ requestId: request.tradeRequestId, action: actionType })
      useToastStore.getState().showToast(doneMessage)
      // 처리한 행이 다른 탭으로 옮겨지기 전에 키보드 포커스를 이어준다.
      const focusedRow = document.activeElement?.closest('[data-trade-request-id]')
      if (focusedRow?.getAttribute('data-trade-request-id') === String(request.tradeRequestId)) {
        tabRefs.current[tab]?.focus()
      }
    } catch (actionError) {
      setError(getTradeRequestActionErrorMessage(actionError, actionType))
    } finally {
      setPendingId(null)
      setPendingAction(null)
    }
  }

  return (
    <section
      aria-labelledby={`${tabsId}-heading`}
      style={{ clipPath: pixelBox(6) }}
      className="min-w-0 bg-primary-tint p-[2px]"
    >
      <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={`${tabsId}-heading`} className="text-head-03 font-bold text-text-strong">내 거래</h2>
            {!requestsQuery.isPending && !requestsQuery.isError && (
              <span className="shrink-0 text-xs text-text-muted">전체 {requests.length}건</span>
            )}
          </div>
          <p className="mt-1.5 text-body-04 leading-relaxed text-text-muted">요청부터 완료까지, 거래의 모든 과정을 한곳에서.</p>
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
                onClick={() => setTab(key)}
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
        <p role="status" className="sr-only">{pendingId !== null ? '거래 요청을 처리하는 중이에요.' : ''}</p>

        {TABS.filter(({ key }) => key !== tab).map(({ key }) => (
          <div key={key} id={`${tabsId}-panel-${key}`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${key}`} hidden />
        ))}
        <div id={`${tabsId}-panel-${tab}`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${tab}`} tabIndex={0} className={`mt-5 ${FOCUS_STYLE}`}>
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
                  <p className="mt-5 text-body-03 font-bold text-text-strong">{EMPTY_STATE[tab].title}</p>
                  <p className="mt-2 max-w-xs text-body-04 leading-relaxed text-text-muted">{EMPTY_STATE[tab].description}</p>
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
                  {visible.map((request) => {
                    const { tradeRequestStatus: status, isRequester, item } = request
                    const busy = pendingId === request.tradeRequestId
                    return (
                      <li key={request.tradeRequestId} data-trade-request-id={request.tradeRequestId} aria-busy={busy} className="py-5 first:pt-1 last:pb-0">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <ItemPhoto imageUrl={item.imageUrl} status={status} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-text-muted">{TRADE_TYPE_LABEL[item.tradeType]}</span>
                              <span style={{ clipPath: pixelBox(2) }} className={`px-2 py-1 text-[11px] leading-4 ${STATUS_TONE[status]}`}>
                                {status === 'PENDING' && !isRequester ? '응답 필요' : STATUS_LABEL[status]}
                              </span>
                            </div>
                            <p title={item.title} className="truncate text-body-03 font-bold text-text-strong">{item.title}</p>
                            <p title={describe(request)} className="mt-1 truncate text-body-04 text-text-muted">
                              {describe(request)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:pl-24">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* 받은 요청 — 판매자만 수락·거절할 수 있다 */}
                            {status === 'PENDING' && !isRequester && (
                              <>
                                <button
                                  type="button"
                                  disabled={pendingId !== null}
                                  onClick={() => void run(request, 'accept', '거래 요청을 수락했어요')}
                                  style={{ clipPath: pixelBox(2) }}
                                  className={PRIMARY_ACTION}
                                >
                                  {busy && pendingAction === 'accept' ? '처리 중...' : '요청 수락'}
                                </button>
                                <button
                                  type="button"
                                  disabled={pendingId !== null}
                                  onClick={() => void run(request, 'reject', '거래 요청을 거절했어요')}
                                  style={{ clipPath: pixelBox(2) }}
                                  className={SECONDARY_ACTION}
                                >
                                  {busy && pendingAction === 'reject' ? '처리 중...' : '거절'}
                                </button>
                              </>
                            )}

                            {/* 보낸 요청 — 아직 수락 전이면 거둬들일 수 있다 */}
                            {status === 'PENDING' && isRequester && (
                              <button
                                type="button"
                                disabled={pendingId !== null}
                                onClick={() => void run(request, 'cancel', '거래 요청을 취소했어요')}
                                style={{ clipPath: pixelBox(2) }}
                                className={SECONDARY_ACTION}
                              >
                                {busy ? '처리 중...' : '요청 취소'}
                              </button>
                            )}

                            {/* 완료는 요청자만 누를 수 있다 (백엔드 validateRequester). 판매자에게는 아예 보이지 않게 한다 */}
                            {status === 'ACCEPTED' && isRequester && (
                              <button
                                type="button"
                                disabled={pendingId !== null}
                                onClick={() => void run(request, 'complete', '거래를 마쳤어요')}
                                style={{ clipPath: pixelBox(2) }}
                                className={PRIMARY_ACTION}
                              >
                                {busy ? '처리 중...' : '거래 완료'}
                              </button>
                            )}
                            {status === 'ACCEPTED' && !isRequester && (
                              <p className="text-xs text-text-muted">상대방의 거래 완료를 기다리고 있어요.</p>
                            )}
                          </div>
                          <Link
                            to={`/items/${item.itemId}`}
                            viewTransition
                            aria-label={`${item.title} 상품 보기`}
                            className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-1.5 px-1 text-body-04 text-text-muted transition-colors hover:text-text-strong ${FOCUS_STYLE}`}
                          >
                            상품 보기 <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0" />
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
