import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { isAxiosError } from 'axios'

import {
  MarketCover,
  useMarket,
  useMarketInvitation,
  useMarketMembers,
} from '../../../entities/market'
import type { MarketMember } from '../../../entities/market'
import type { RelationshipStatus } from '../../../entities/friend'
import { ProductCard, STATUS_LABEL, useMarketProducts } from '../../../entities/product'
import type { ProductStatus } from '../../../entities/product'
import { useMyProfile } from '../../../entities/user'
import {
  getFriendRequestActionErrorMessage,
  getSendFriendRequestErrorMessage,
  useRespondToFriendRequest,
  useSendFriendRequest,
} from '../../../features/friend-manage'
import { InviteLinkModal } from '../../../features/market-invite'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 403) return '참여하지 않은 마켓이라 볼 수 없어요.'
  if (status === 404) return '마켓을 찾을 수 없어요.'

  return '마켓 정보를 불러오지 못했어요.'
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

// Tailwind가 클래스를 수집할 수 있도록 줄 수를 포함한 전체 문자열을 선언한다.
const DESCRIPTION_CLAMP_CLASS = 'line-clamp-8'

// 관계가 없는 참여자는 안내 문구 없이 친구 추가 버튼만 표시한다.
const FRIEND_RELATIONSHIP_CAPTION: Record<RelationshipStatus, string> = {
  SELF: '',
  NONE: '',
  REQUESTED: '친구 요청을 보냈어요',
  REQUEST_RECEIVED: '나에게 친구 요청을 보냈어요',
  FRIEND: '이미 친구예요',
}

const PRODUCTS_PER_PAGE = 12

function readProductPage(value: string | null) {
  return value !== null && /^\d+$/.test(value) ? Number(value) : 0
}

type StatusFilter = 'ALL' | ProductStatus

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: '전체' },
  ...(Object.keys(STATUS_LABEL) as ProductStatus[]).map((key) => ({
    key,
    label: STATUS_LABEL[key],
  })),
]

function readStatusFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.some(({ key }) => key === value) ? (value as StatusFilter) : 'ALL'
}

// line-clamp로 내용이 잘렸는지 측정하고, 너비가 바뀌면 다시 확인한다.
function MarketDescription({ description }: { description: string | null }) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = textRef.current

    // 펼친 상태에서는 이전 측정값을 유지해 접기 버튼이 사라지지 않게 한다.
    if (!element || isExpanded) return

    const measure = () => setIsOverflowing(element.scrollHeight > element.clientHeight + 1)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [description, isExpanded])

  return (
    <div>
      <p
        ref={textRef}
        className={`max-w-2xl whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted sm:text-body-02 ${
          isExpanded ? '' : DESCRIPTION_CLAMP_CLASS
        }`}
      >
        {description || '소개글이 없어요'}
      </p>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="mt-2 text-body-04 font-bold text-primary"
        >
          {isExpanded ? '접기' : '더보기'}
        </button>
      )}
    </div>
  )
}

export function MarketDetailPage() {
  const { marketId: marketIdParam } = useParams()
  const marketId = Number(marketIdParam)
  const isValidId = Number.isInteger(marketId) && marketId > 0

  // URL에 페이지를 저장해 상품 상세에서 돌아와도 같은 목록을 표시한다.
  const [searchParams, setSearchParams] = useSearchParams()
  const productPage = readProductPage(searchParams.get('productPage'))
  // 상품 상세에서 돌아와도 같은 조건으로 보이도록 검색어와 상태도 URL에 둔다.
  const statusFilter = readStatusFilter(searchParams.get('status'))
  const appliedKeyword = searchParams.get('q') ?? ''

  const [keyword, setKeyword] = useState(appliedKeyword)
  const isComposingRef = useRef(false)

  const marketQuery = useMarket(marketId)
  const membersQuery = useMarketMembers(marketId)
  const productsQuery = useMarketProducts(marketId)
  const meQuery = useMyProfile()

  const market = marketQuery.data
  const isHost = market !== undefined && market.hostId === meQuery.data?.memberId
  const invitationQuery = useMarketInvitation(marketId, isHost)

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const membersListRef = useRef<HTMLUListElement>(null)
  const [areMembersExpanded, setAreMembersExpanded] = useState(false)
  const [memberColumnCount, setMemberColumnCount] = useState(2)

  const allProducts = productsQuery.data ?? []
  const normalizedKeyword = appliedKeyword.trim().toLowerCase()

  const products = allProducts.filter(
    (product) =>
      (statusFilter === 'ALL' || product.status === statusFilter) &&
      product.title.toLowerCase().includes(normalizedKeyword),
  )
  const productPageCount = Math.ceil(products.length / PRODUCTS_PER_PAGE)
  const pageProducts = products.slice(
    productPage * PRODUCTS_PER_PAGE,
    (productPage + 1) * PRODUCTS_PER_PAGE,
  )

  // 첫 페이지는 기본 경로를 사용하고, 다른 검색 매개변수는 유지한다.
  const productListParams = new URLSearchParams(searchParams)

  if (productPage === 0) productListParams.delete('productPage')
  else productListParams.set('productPage', String(productPage))

  const productListQuery = productListParams.toString()
  const productListPath = productListQuery
    ? `/market/${marketId}?${productListQuery}`
    : `/market/${marketId}`

  const members = membersQuery.data ?? []
  const hasMoreMembers = members.length > memberColumnCount
  const visibleMembers = areMembersExpanded ? members : members.slice(0, memberColumnCount)

  // 삭제나 재조회로 페이지 수가 줄면 URL도 유효한 마지막 페이지로 보정한다.
  useEffect(() => {
    if (!productsQuery.data) return

    const lastPage = Math.max(0, productPageCount - 1)

    if (productPage <= lastPage) return

    const params = new URLSearchParams(searchParams)

    if (lastPage === 0) params.delete('productPage')
    else params.set('productPage', String(lastPage))

    setSearchParams(params, { replace: true, preventScrollReset: true })
  }, [productPage, productPageCount, productsQuery.data, searchParams, setSearchParams])

  // 접힌 참여자 목록은 현재 반응형 그리드의 한 행만 보여준다.
  useLayoutEffect(() => {
    const list = membersListRef.current

    if (!list) return

    const measure = () => {
      const columns = window
        .getComputedStyle(list)
        .gridTemplateColumns.split(' ')
        .filter(Boolean).length

      setMemberColumnCount(Math.max(1, columns))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(list)

    return () => observer.disconnect()
  }, [membersQuery.data])

  useEffect(() => {
    setAreMembersExpanded(false)
  }, [marketId])

  useEffect(() => {
    if (!hasMoreMembers) setAreMembersExpanded(false)
  }, [hasMoreMembers])

  // 조건이 바뀌면 결과 수가 달라지므로 첫 페이지부터 보여준다.
  function updateProductFilter(next: { status?: StatusFilter; q?: string }) {
    const params = new URLSearchParams(searchParams)
    const status = next.status ?? statusFilter
    const q = (next.q ?? appliedKeyword).trim()

    if (status === 'ALL') params.delete('status')
    else params.set('status', status)

    if (q) params.set('q', q)
    else params.delete('q')

    params.delete('productPage')

    setSearchParams(params, { replace: true, preventScrollReset: true })
  }

  function selectProductPage(page: number) {
    const params = new URLSearchParams(searchParams)

    if (page === 0) params.delete('productPage')
    else params.set('productPage', String(page))

    setSearchParams(params, { replace: true, preventScrollReset: true })
  }

  const [selectedMember, setSelectedMember] = useState<MarketMember | null>(null)
  const [friendError, setFriendError] = useState('')
  const sendFriendRequestMutation = useSendFriendRequest()
  const respondFriendRequestMutation = useRespondToFriendRequest()
  const isFriendActionRunning =
    sendFriendRequestMutation.isPending || respondFriendRequestMutation.isPending

  function openMember(member: MarketMember) {
    setSelectedMember(member)
    setFriendError('')
  }

  function handleSendFriendRequest(memberId: number) {
    setFriendError('')

    sendFriendRequestMutation.mutate(memberId, {
      onSuccess: () => {
        useToastStore.getState().showToast('친구 요청을 보냈어요')
        setSelectedMember(null)
      },
      onError: (error) => setFriendError(getSendFriendRequestErrorMessage(error)),
    })
  }

  function handleAcceptFriendRequest(memberId: number) {
    setFriendError('')

    respondFriendRequestMutation.mutate(
      { action: 'accept', memberId },
      {
        onSuccess: () => {
          useToastStore.getState().showToast('친구가 되었어요')
          setSelectedMember(null)
        },
        onError: (error) => setFriendError(getFriendRequestActionErrorMessage(error, '수락')),
      },
    )
  }

  const newProductPath = `/market/${marketId}/items/new`

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-8 md:px-14 lg:px-24">
        <Link
          to="/market"
          viewTransition
          className="text-body-04 text-text-muted hover:text-text-strong"
        >
          ← 내 마켓
        </Link>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="h-24 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(marketQuery.error) : '마켓을 찾을 수 없어요.'}
            </p>
          </div>
        ) : !market ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">
            마켓을 불러오는 중이에요...
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 sm:mt-4 sm:gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-head-03 font-bold text-text-strong sm:text-head-02">
                  {market.title}
                </h1>
                {isHost && (
                  <span
                    style={{ clipPath: pixelBox(2) }}
                    className="shrink-0 bg-primary-subtle px-2 py-1 text-xs font-bold text-text-muted"
                  >
                    HOST
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {isHost && (
                  <button
                    type="button"
                    onClick={() => setIsInviteOpen(true)}
                    disabled={!invitationQuery.data}
                    style={{ clipPath: pixelBox(4) }}
                    className="group h-10 bg-primary-tint p-[2px] disabled:opacity-50 sm:h-11"
                  >
                    <span
                      style={{ clipPath: pixelBox(4) }}
                      className="flex h-full items-center bg-primary-subtle px-4 text-body-04 font-bold text-text-muted sm:px-5 transition-colors duration-200 group-enabled:group-hover:bg-white"
                    >
                      초대 링크
                    </span>
                  </button>
                )}
                <Link
                  to={newProductPath}
                  viewTransition
                  style={{ clipPath: pixelBox(4) }}
                  className="flex h-10 items-center bg-primary px-4 text-body-04 font-bold text-white sm:h-11 sm:px-5 transition-colors duration-200 hover:bg-primary/90"
                >
                  + 상품 등록
                </Link>
              </div>
            </div>
            {isHost && invitationQuery.isError && (
              <p className="mt-2 text-right text-body-04 text-text-muted">
                초대 링크를 불러오지 못했어요.
              </p>
            )}

            <section className="mt-4">
              <MarketDescription description={market.description} />
            </section>

            {/* MarketCover가 style을 받지 않아 바깥 요소에 모서리 클리핑을 적용한다. */}
            <div className="mt-4 sm:mt-6" style={{ clipPath: pixelBox(6) }}>
              <MarketCover
                coverImageUrl={market.coverImageUrl}
                marketId={market.marketId}
                variant="bare"
                className="h-32 w-full sm:h-56 md:h-72"
              />
            </div>

            <dl className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {[
                { label: '호스트', value: market.hostNickname },
                { label: '참여자', value: `${market.memberCount}명` },
                { label: '개설일', value: formatDate(market.createdAt) },
              ].map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className="text-[11px] font-semibold text-gray-400">{label}</dt>
                  <dd className="mr-4 text-[11px] font-bold text-gray-400">{value}</dd>
                </Fragment>
              ))}
            </dl>

            <section className="mt-8 sm:mt-14">
              <h2 className="text-body-01 font-bold text-text-strong sm:text-head-03">
                상품{' '}
                {productsQuery.data && <span className="text-primary">{allProducts.length}</span>}
              </h2>

              {allProducts.length > 0 && (
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div role="group" aria-label="거래 상태" className="flex flex-wrap gap-1.5">
                    {STATUS_FILTERS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updateProductFilter({ status: key })}
                        aria-pressed={statusFilter === key}
                        style={{ clipPath: pixelBox(2) }}
                        className={`h-9 px-3 text-body-04 font-bold transition-colors ${
                          statusFilter === key
                            ? 'bg-primary text-white'
                            : 'bg-primary-subtle text-text-muted hover:bg-primary-tint hover:text-text-strong'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <label className="flex w-full items-center gap-2 rounded-full bg-primary-subtle px-5 py-2.5 focus-within:ring-2 focus-within:ring-primary-tint md:max-w-xs">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-5 shrink-0 text-text-muted"
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
                      onChange={(event) => {
                        setKeyword(event.target.value)
                        if (!isComposingRef.current) updateProductFilter({ q: event.target.value })
                      }}
                      onCompositionStart={() => {
                        isComposingRef.current = true
                      }}
                      onCompositionEnd={(event) => {
                        isComposingRef.current = false
                        updateProductFilter({ q: event.currentTarget.value })
                      }}
                      placeholder="상품 이름으로 검색"
                      aria-label="상품 검색"
                      className="w-full bg-transparent text-body-04 text-text-strong outline-none placeholder:text-text-muted/50"
                    />
                  </label>
                </div>
              )}
              {productsQuery.isPending ? (
                <p className="mt-4 text-body-04 text-text-muted">상품을 불러오는 중이에요...</p>
              ) : productsQuery.isError ? (
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-body-04 text-text-muted">상품 목록을 불러오지 못했어요.</p>
                  <button
                    type="button"
                    onClick={() => void productsQuery.refetch()}
                    className="text-body-04 font-bold text-primary underline"
                  >
                    다시 시도
                  </button>
                </div>
              ) : allProducts.length === 0 ? (
                <div
                  className="mt-4 flex flex-col items-center bg-primary-subtle py-14 text-center"
                  style={{ clipPath: pixelBox(6) }}
                >
                  <img
                    draggable={false}
                    src={MASCOTS.basket}
                    alt=""
                    className="h-20 object-contain [image-rendering:pixelated]"
                  />
                  <p className="mt-3 text-body-03 font-bold text-text-strong">
                    아직 등록된 상품이 없어요
                  </p>
                  <p className="mt-1 text-body-04 text-text-muted">
                    첫 상품을 올려서 마켓을 채워보세요!
                  </p>
                  <Link
                    to={newProductPath}
                    viewTransition
                    style={{ clipPath: pixelBox(4) }}
                    className="mt-5 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
                  >
                    + 첫 상품 등록하기
                  </Link>
                </div>
              ) : products.length === 0 ? (
                <p className="mt-10 text-center text-body-04 text-text-muted">
                  조건에 맞는 상품이 없어요.
                </p>
              ) : (
                <>
                  <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
                    {pageProducts.map((product) => (
                      <li key={product.itemId}>
                        <ProductCard
                          product={product}
                          backTarget={{ to: productListPath, label: market.title }}
                        />
                      </li>
                    ))}
                  </ul>

                  {productPageCount > 1 && (
                    <nav
                      aria-label="마켓 상품 목록 페이지"
                      className="mt-6 flex flex-wrap justify-center gap-1.5 border-t border-primary-subtle pt-4"
                    >
                      {Array.from({ length: productPageCount }, (_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectProductPage(index)}
                          aria-label={`${index + 1}페이지`}
                          aria-current={productPage === index ? 'page' : undefined}
                          style={{ clipPath: pixelBox(2) }}
                          className={
                            productPage === index
                              ? 'size-8 bg-primary text-body-04 font-bold text-white'
                              : 'size-8 bg-primary-subtle text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong'
                          }
                        >
                          {index + 1}
                        </button>
                      ))}
                    </nav>
                  )}
                </>
              )}
            </section>

            <section className="mt-8 sm:mt-14">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-body-01 font-bold text-text-strong sm:text-head-03">
                  참여자 <span className="text-primary">{market.memberCount}</span>
                </h2>
                {hasMoreMembers && (
                  <button
                    type="button"
                    onClick={() => setAreMembersExpanded((value) => !value)}
                    aria-expanded={areMembersExpanded}
                    aria-controls="market-members"
                    className="shrink-0 text-body-04 font-bold text-gray-400 transition-colors hover:text-gray-500"
                  >
                    {areMembersExpanded ? '접기' : '더보기'}
                  </button>
                )}
              </div>
              {membersQuery.isPending ? (
                <p className="mt-4 text-body-04 text-text-muted">참여자를 불러오는 중이에요...</p>
              ) : membersQuery.isError ? (
                <p className="mt-4 text-body-04 text-text-muted">
                  참여자 목록을 불러오지 못했어요.
                </p>
              ) : (
                <ul
                  id="market-members"
                  ref={membersListRef}
                  className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7"
                >
                  {visibleMembers.map((member) => {
                    const isMe = member.relationshipStatus === 'SELF'
                    const chipClass =
                      'flex h-11 w-full min-w-0 items-center gap-1.5 bg-primary-subtle pl-1.5 pr-2.5'
                    const content = (
                      <>
                        <Avatar
                          profileImageUrl={member.profileImageUrl}
                          size="sm"
                          className="bg-white"
                        />
                        <span className="min-w-0 truncate text-body-04 font-semibold text-text-strong">
                          {member.nickname}
                          {isMe && ' (나)'}
                        </span>
                        {member.host && (
                          <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                            HOST
                          </span>
                        )}
                      </>
                    )

                    return (
                      <li key={member.memberId} className="min-w-0">
                        {/* 본인에게는 친구 요청을 보낼 수 없으므로 프로필 버튼을 만들지 않는다. */}
                        {isMe ? (
                          <div style={{ clipPath: pixelBox() }} className={chipClass}>
                            {content}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openMember(member)}
                            style={{ clipPath: pixelBox() }}
                            className={`${chipClass} transition-colors duration-200 hover:bg-primary-tint`}
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <Modal
              open={selectedMember !== null}
              onRequestClose={() => setSelectedMember(null)}
              labelledBy="member-modal-title"
              size="sm"
            >
              {selectedMember && (
                <div className="py-6 text-center">
                  <Avatar
                    profileImageUrl={selectedMember.profileImageUrl}
                    size="lg"
                    className="mx-auto"
                  />
                  <h2
                    id="member-modal-title"
                    className="mt-6 text-head-03 font-bold text-text-strong"
                  >
                    {selectedMember.nickname}
                  </h2>
                  <p className="mt-2 text-body-04 text-text-muted">
                    {selectedMember.host ? '이 마켓을 연 호스트예요' : '이 마켓에 참여하고 있어요'}
                  </p>
                  {FRIEND_RELATIONSHIP_CAPTION[selectedMember.relationshipStatus] && (
                    <p className="mt-1 text-body-04 font-bold text-primary">
                      {FRIEND_RELATIONSHIP_CAPTION[selectedMember.relationshipStatus]}
                    </p>
                  )}
                  {friendError && <p className="mt-4 text-body-04 text-red-600">{friendError}</p>}

                  {/* 중복 요청을 막기 위해 현재 관계에서 가능한 동작만 표시한다. */}
                  {selectedMember.relationshipStatus === 'NONE' && (
                    <button
                      type="button"
                      disabled={isFriendActionRunning}
                      onClick={() => handleSendFriendRequest(selectedMember.memberId)}
                      style={{ clipPath: pixelBox(4) }}
                      className="mt-8 w-full bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                    >
                      {isFriendActionRunning ? '보내는 중...' : '친구 추가'}
                    </button>
                  )}
                  {selectedMember.relationshipStatus === 'REQUEST_RECEIVED' && (
                    <button
                      type="button"
                      disabled={isFriendActionRunning}
                      onClick={() => handleAcceptFriendRequest(selectedMember.memberId)}
                      style={{ clipPath: pixelBox(4) }}
                      className="mt-8 w-full bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                    >
                      {isFriendActionRunning ? '받는 중...' : '친구 수락'}
                    </button>
                  )}

                  {selectedMember.relationshipStatus !== 'SELF' && (
                    <Link
                      to={`/members/${selectedMember.memberId}/item-dex`}
                      state={{ nickname: selectedMember.nickname }}
                      className="mt-4 block text-body-04 font-bold text-text-muted underline transition-colors duration-200 hover:text-text-strong"
                    >
                      물건 도감 보기
                    </Link>
                  )}
                </div>
              )}
            </Modal>

            {invitationQuery.data && (
              <InviteLinkModal
                open={isInviteOpen}
                marketTitle={market.title}
                inviteCode={invitationQuery.data.inviteCode}
                onClose={() => setIsInviteOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
