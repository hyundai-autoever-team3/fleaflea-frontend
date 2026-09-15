import { Link, useParams } from 'react-router'
import { isAxiosError } from 'axios'

import { MarketCover, useMarket, useMarketMembers } from '../../../entities/market'
import { useMyProfile } from '../../../entities/user'
import { pixelBox } from '../../../shared/lib/pixel'
import { Header } from '../../../widgets/header'

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 403) return '참여하지 않은 마켓이라 볼 수 없어요.'
  if (status === 404) return '마켓을 찾을 수 없어요.'
  return '마켓 정보를 불러오지 못했어요.'
}

export function MarketDetailPage() {
  const { marketId: marketIdParam } = useParams()
  const marketId = Number(marketIdParam)
  const isValidId = Number.isInteger(marketId) && marketId > 0

  const marketQuery = useMarket(marketId)
  const membersQuery = useMarketMembers(marketId)
  const meQuery = useMyProfile()

  const market = marketQuery.data
  const isHost = market !== undefined && market.hostId === meQuery.data?.memberId

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Link to="/market" className="text-body-04 text-text-muted hover:text-text-strong">
          ← 내 마켓
        </Link>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src="/mascot/flea4.png" alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(marketQuery.error) : '마켓을 찾을 수 없어요.'}
            </p>
          </div>
        ) : !market ? (
          <p className="py-24 text-center text-body-03 text-text-muted">마켓을 불러오는 중이에요...</p>
        ) : (
          <>
            {/* 마켓 정보 */}
            <section className="mt-6 flex flex-col gap-8 md:flex-row md:items-center">
              <MarketCover coverImageUrl={market.coverImageUrl} marketId={market.marketId} className="w-56 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-head-02 font-bold text-text-strong">{market.title}</h1>
                  {isHost && (
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">HOST</span>
                  )}
                </div>
                <p className="mt-2 text-body-02 text-text-muted">{market.description || '소개글이 없어요'}</p>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-body-04 text-text-muted">
                  <div className="flex gap-1">
                    <dt>호스트</dt>
                    <dd className="font-bold text-text-strong">{market.hostNickname}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>참여자</dt>
                    <dd className="font-bold text-text-strong">{market.memberCount}명</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt>개설일</dt>
                    <dd className="font-bold text-text-strong">{new Date(market.createdAt).toLocaleDateString('ko-KR')}</dd>
                  </div>
                </dl>
              </div>
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
                        src={member.profileImageUrl || '/mascot/flea.png'}
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

            {/* 상품: 아직 백엔드 API 없음 */}
            <section className="mt-14">
              <h2 className="text-head-03 font-bold text-text-strong">상품</h2>
              <div className="mt-4 flex flex-col items-center bg-primary-subtle py-14 text-center" style={{ clipPath: pixelBox(6) }}>
                <img src="/mascot/flea10.png" alt="" className="h-20 object-contain [image-rendering:pixelated]" />
                <p className="mt-3 text-body-03 text-text-muted">상품 기능은 준비 중이에요.</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
