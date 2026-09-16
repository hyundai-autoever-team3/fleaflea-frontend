import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { MarketCover, useMarket, useMarketInvitation, useMarketMembers } from '../../../entities/market'
import { ProductCard, useMarketProducts } from '../../../entities/product'
import { useMyProfile } from '../../../entities/user'
import { InviteLinkModal } from '../../../features/market-invite'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
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

  const marketQuery = useMarket(marketId)
  const membersQuery = useMarketMembers(marketId)
  const productsQuery = useMarketProducts(marketId)
  const meQuery = useMyProfile()

  const market = marketQuery.data
  const isHost = market !== undefined && market.hostId === meQuery.data?.memberId
  const invitationQuery = useMarketInvitation(marketId, isHost)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const newProductPath = `/market/${marketId}/items/new`

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Link to="/market" viewTransition className="text-body-04 text-text-muted hover:text-text-strong">
          ← 내 마켓
        </Link>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(marketQuery.error) : '마켓을 찾을 수 없어요.'}
            </p>
          </div>
        ) : !market ? (
          <p className="py-24 text-center text-body-03 text-text-muted">마켓을 불러오는 중이에요...</p>
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
                상품 {productsQuery.data && <span className="text-primary">{productsQuery.data.length}</span>}
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
              ) : productsQuery.data.length === 0 ? (
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
                <ul className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                  {productsQuery.data.map((product) => (
                    <li key={product.itemId}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
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
                  {membersQuery.data.map((member) => (
                    <li
                      key={member.memberId}
                      style={{ clipPath: pixelBox() }}
                      className="flex items-center gap-2 bg-primary-subtle py-2 pl-2 pr-4"
                    >
                      <img
                        src={member.profileImageUrl || MASCOTS.default}
                        alt=""
                        style={{ clipPath: pixelBox(2) }}
                        className="size-8 bg-white object-cover"
                      />
                      <span className="text-body-04 font-semibold text-text-strong">{member.nickname}</span>
                      {member.host && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">HOST</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

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
