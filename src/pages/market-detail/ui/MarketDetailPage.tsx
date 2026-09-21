import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { isAxiosError } from 'axios'

import { MarketCover, useMarket, useMarketInvitation, useMarketMembers } from '../../../entities/market'
import type { MarketMember } from '../../../entities/market'
import type { RelationshipStatus } from '../../../entities/friend'
import { ProductCard, useMarketProducts } from '../../../entities/product'
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

// 옆에 놓인 커버(288px) 높이에 맞춘 줄 수. 이보다 적게 접으면 커버 옆에 빈 공간만 생김.
// Tailwind는 소스의 문자열을 그대로 훑어 클래스를 만들므로 `line-clamp-${n}`처럼 조립하면 안 됨
const DESCRIPTION_CLAMP_CLASS = 'line-clamp-8'

// 참여자 목록이 나와의 친구 관계를 함께 내려주므로, 눌러도 실패할 버튼을 미리 감출 수 있다.
// 아무 관계도 없을 때(NONE)는 "친구 추가" 버튼이 그 자리를 대신하므로 문구를 두지 않는다
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

// line-clamp는 잘렸는지를 알려주지 않아, 접힌 상태의 실제 내용 높이와 보이는 높이를 재서 판단.
// 창 폭이 바뀌면 줄 수가 달라지므로 ResizeObserver로 다시 잼
function MarketDescription({ description }: { description: string | null }) {
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = textRef.current
    // 펼친 상태에서는 잘릴 일이 없어 측정하지 않고, 접기 버튼이 유지되도록 값을 그대로 둠
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
        className={`max-w-2xl whitespace-pre-wrap text-body-02 leading-relaxed text-text-muted ${
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
  const [searchParams, setSearchParams] = useSearchParams()
  const productPage = readProductPage(searchParams.get('productPage'))

  const marketQuery = useMarket(marketId)
  const membersQuery = useMarketMembers(marketId)
  const productsQuery = useMarketProducts(marketId)
  const meQuery = useMyProfile()

  const market = marketQuery.data
  const isHost = market !== undefined && market.hostId === meQuery.data?.memberId
  const invitationQuery = useMarketInvitation(marketId, isHost)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const products = productsQuery.data ?? []
  const productPageCount = Math.ceil(products.length / PRODUCTS_PER_PAGE)
  const pageProducts = products.slice(
    productPage * PRODUCTS_PER_PAGE,
    (productPage + 1) * PRODUCTS_PER_PAGE,
  )
  const productListParams = new URLSearchParams(searchParams)
  if (productPage === 0) productListParams.delete('productPage')
  else productListParams.set('productPage', String(productPage))
  const productListQuery = productListParams.toString()
  const productListPath = productListQuery ? `/market/${marketId}?${productListQuery}` : `/market/${marketId}`

  useEffect(() => {
    if (!productsQuery.data) return
    const lastPage = Math.max(0, productPageCount - 1)
    if (productPage <= lastPage) return

    const params = new URLSearchParams(searchParams)
    if (lastPage === 0) params.delete('productPage')
    else params.set('productPage', String(lastPage))
    setSearchParams(params, { replace: true })
  }, [productPage, productPageCount, productsQuery.data, searchParams, setSearchParams])

  function selectProductPage(page: number) {
    const params = new URLSearchParams(searchParams)
    if (page === 0) params.delete('productPage')
    else params.set('productPage', String(page))
    setSearchParams(params, { replace: true })
  }

  // 닉네임 검색 API가 없어 memberId를 알 수 있는 곳이 참여자 목록뿐이라, 친구 추가를 여기서 함
  const [selectedMember, setSelectedMember] = useState<MarketMember | null>(null)
  const [friendError, setFriendError] = useState('')
  const sendFriendRequestMutation = useSendFriendRequest()
  const respondFriendRequestMutation = useRespondToFriendRequest()
  const isRequesting = sendFriendRequestMutation.isPending || respondFriendRequestMutation.isPending

  function openMember(member: MarketMember) {
    setSelectedMember(member)
    setFriendError('')
  }

  function handleSendFriendRequest(memberId: number) {
    setFriendError('')
    // 이미 친구이거나 보낸 요청이면 서버가 409를 주므로 목록을 미리 고쳐 두지 않는다.
    // 목록 새로고침은 useSendFriendRequest 안에서 한다
    sendFriendRequestMutation.mutate(memberId, {
      onSuccess: () => {
        useToastStore.getState().showToast('친구 요청을 보냈어요')
        setSelectedMember(null)
      },
      onError: (error) => setFriendError(getSendFriendRequestErrorMessage(error)),
    })
  }

  // 상대가 먼저 보낸 요청은 여기서 바로 받아 줄 수 있다. 친구 화면까지 가지 않아도 되게
  function handleAcceptFriendRequest(memberId: number) {
    setFriendError('')
    respondFriendRequestMutation.mutate({ action: 'accept', memberId }, {
      onSuccess: () => {
        useToastStore.getState().showToast('친구가 되었어요')
        setSelectedMember(null)
      },
      onError: (error) => setFriendError(getFriendRequestActionErrorMessage(error, '수락')),
    })
  }

  const newProductPath = `/market/${marketId}/items/new`

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        <Link to="/market" viewTransition className="text-body-04 text-text-muted hover:text-text-strong">
          ← 내 마켓
        </Link>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(marketQuery.error) : '마켓을 찾을 수 없어요.'}
            </p>
          </div>
        ) : !market ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">마켓을 불러오는 중이에요...</p>
        ) : (
          <>
            {/* 마켓 이름 + 초대 링크 / 상품 등록 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-head-02 font-bold text-text-strong">{market.title}</h1>
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
                    className="group h-11 bg-primary-tint p-[2px] disabled:opacity-50"
                  >
                    <span
                      style={{ clipPath: pixelBox(4) }}
                      className="flex h-full items-center bg-primary-subtle px-5 text-body-04 font-bold text-text-muted transition-colors duration-200 group-enabled:group-hover:bg-white"
                    >
                      초대 링크
                    </span>
                  </button>
                )}
                <Link
                  to={newProductPath}
                  viewTransition
                  style={{ clipPath: pixelBox(4) }}
                  className="flex h-11 items-center bg-primary px-5 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                >
                  + 상품 등록
                </Link>
              </div>
            </div>
            {/* 에러 문구는 버튼 밖에 둬서 버튼 길이가 바뀌지 않게 함 */}
            {isHost && invitationQuery.isError && (
              <p className="mt-2 text-right text-body-04 text-text-muted">초대 링크를 불러오지 못했어요.</p>
            )}

            {/* 마켓 소개 — 배너 아래, 카드 없이 페이지 바탕 위에 놓음 */}
            <section className="mt-4">
              <MarketDescription description={market.description} />
            </section>

            {/* 커버 — MarketCover는 style을 받지 않아 픽셀 모서리는 바깥 div에 */}
            <div className="mt-6" style={{ clipPath: pixelBox(6) }}>
              <MarketCover
                coverImageUrl={market.coverImageUrl}
                marketId={market.marketId}
                variant="bare"
                className="h-56 w-full md:h-72"
              />
            </div>

            {/* 호스트 · 참여자 · 개설일 — 사진 아래. 박스 없이 글자만 */}
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

            {/* 상품 */}
            <section className="mt-14">
              <h2 className="text-head-03 font-bold text-text-strong">
                상품 {productsQuery.data && <span className="text-primary">{products.length}</span>}
              </h2>
              {productsQuery.isPending ? (
                <p className="mt-4 text-body-04 text-text-muted">상품을 불러오는 중이에요...</p>
              ) : productsQuery.isError ? (
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-body-04 text-text-muted">상품 목록을 불러오지 못했어요.</p>
                  <button type="button" onClick={() => void productsQuery.refetch()} className="text-body-04 font-bold text-primary underline">
                    다시 시도
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="mt-4 flex flex-col items-center bg-primary-subtle py-14 text-center" style={{ clipPath: pixelBox(6) }}>
                  <img src={MASCOTS.basket} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                  <p className="mt-3 text-body-03 font-bold text-text-strong">아직 등록된 상품이 없어요</p>
                  <p className="mt-1 text-body-04 text-text-muted">첫 상품을 올려서 마켓을 채워보세요!</p>
                  <Link
                    to={newProductPath}
                    viewTransition
                    style={{ clipPath: pixelBox(4) }}
                    className="mt-5 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
                  >
                    + 첫 상품 등록하기
                  </Link>
                </div>
              ) : (
                <>
                  <ul className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
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

            {/* 참여자 */}
            <section className="mt-14">
              <h2 className="text-head-03 font-bold text-text-strong">
                참여자 <span className="text-primary">{market.memberCount}</span>
              </h2>
              {membersQuery.isPending ? (
                <p className="mt-4 text-body-04 text-text-muted">참여자를 불러오는 중이에요...</p>
              ) : membersQuery.isError ? (
                <p className="mt-4 text-body-04 text-text-muted">참여자 목록을 불러오지 못했어요.</p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-3">
                  {membersQuery.data.map((member) => {
                    const isMe = member.relationshipStatus === 'SELF'
                    const chipClass = 'flex items-center gap-2 bg-primary-subtle py-2 pl-2 pr-4'
                    const content = (
                      <>
                        <Avatar profileImageUrl={member.profileImageUrl} size="sm" className="bg-white" />
                        <span className="text-body-04 font-semibold text-text-strong">
                          {member.nickname}
                          {isMe && ' (나)'}
                        </span>
                        {member.host && (
                          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">HOST</span>
                        )}
                      </>
                    )

                    return (
                      <li key={member.memberId}>
                        {/* 내 프로필은 모달을 열어도 할 수 있는 게 없어 누를 수 없게 둠 */}
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

            {/* 참여자 프로필 — 친구 요청은 여기서 보냄 */}
            <Modal
              open={selectedMember !== null}
              onRequestClose={() => setSelectedMember(null)}
              labelledBy="member-modal-title"
              size="sm"
              showClose={false}
            >
              {selectedMember && (
                <div className="py-6 text-center">
                  <Avatar profileImageUrl={selectedMember.profileImageUrl} size="lg" className="mx-auto" />
                  <h2 id="member-modal-title" className="mt-6 text-head-03 font-bold text-text-strong">
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

                  {/* X를 없앤 대신 닫기를 둠. 주요 동작인 친구 관련 버튼을 왼쪽에 */}
                  <div className="mt-8 flex gap-3">
                    {/* 이미 친구거나 요청이 오간 사이에 다시 보내면 409라서, 관계에 맞는 버튼만 둔다 */}
                    {selectedMember.relationshipStatus === 'NONE' && (
                      <button
                        type="button"
                        disabled={isRequesting}
                        onClick={() => handleSendFriendRequest(selectedMember.memberId)}
                        style={{ clipPath: pixelBox(4) }}
                        className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                      >
                        {isRequesting ? '보내는 중...' : '친구 추가'}
                      </button>
                    )}
                    {selectedMember.relationshipStatus === 'REQUEST_RECEIVED' && (
                      <button
                        type="button"
                        disabled={isRequesting}
                        onClick={() => handleAcceptFriendRequest(selectedMember.memberId)}
                        style={{ clipPath: pixelBox(4) }}
                        className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                      >
                        {isRequesting ? '받는 중...' : '친구 수락'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedMember(null)}
                      style={{ clipPath: pixelBox(4) }}
                      className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
                    >
                      닫기
                    </button>
                  </div>

                  {/* 도감 보기는 이동이라 버튼 줄에 끼우지 않고 아래에 둠 (좁은 모달에 버튼 3개는 글자가 눌림) */}
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
