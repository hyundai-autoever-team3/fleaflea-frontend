import { Link } from 'react-router'
import { pixelBox, pixelCorners } from '../../../shared/lib/pixel'
import type { MarketSummary } from '../model/types'
import { Awning } from './Awning'
import { MarketCover } from './MarketCover'

interface MarketCardProps {
    market : MarketSummary
    isHost : boolean
}

export function MarketCard({ market, isHost }: MarketCardProps) {
    return <AwningCard market={market} isHost={isHost} />
}

function AwningCard({ market, isHost }: { market: MarketSummary; isHost: boolean }) {
    return(
        <div className="@container min-w-0 w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <Awning color="var(--color-primary-tint)" stripeColor="#f2f3f6" />

            {/* 카드 자체가 충분히 넓을 때만 입장 버튼을 옆에 둔다. 좁으면 아래 한 줄을 쓴다. */}
            <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-x-3 gap-y-4 bg-bg px-4 pb-6 pt-10 @lg:grid-cols-[9rem_minmax(0,1fr)_auto] @lg:gap-5 @lg:px-6 @lg:pb-8 @lg:pt-12" style={{ clipPath: pixelCorners('bottom') }}>
                <MarketCover coverImageUrl={market.coverImageUrl} marketId={market.marketId} className="min-w-0 w-full" />

                <div className="min-w-0">
                    <div className="flex min-w-0 flex-col items-start gap-1.5 @lg:flex-row @lg:items-center @lg:gap-2">
                        <h3 title={market.title} className="order-2 min-w-0 w-full line-clamp-2 text-body-03 font-bold text-text-strong [overflow-wrap:anywhere] @lg:order-none @lg:w-auto @lg:flex-1 @lg:text-xl">{market.title}</h3>
                        {isHost && (
                            <span className="order-1 shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white @lg:order-none">HOST</span>
                        )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-body-04 text-text-muted [overflow-wrap:anywhere] @lg:text-body-03">
                        {market.description || '소개글이 없어요'}
                    </p>
                    {/* 제목 옆 HOST는 "내가 연 마켓"이라는 표시라 진하게 둔다.
                        여기 HOST는 누가 호스트인지 알려주는 이름표일 뿐이라,
                        같은 색이면 둘이 같은 뜻으로 읽힌다. 옆 글자 무게에 맞춰 연하게 */}
                    {!isHost && (
                        <p className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-text-muted @lg:gap-2 @lg:text-body-04">
                            <span className="shrink-0 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary">
                                HOST
                            </span>
                            <span title={market.hostNickname} className="min-w-0 truncate">{market.hostNickname}</span>
                        </p>
                    )}
                </div>

                <Link
                    to={`/market/${market.marketId}`}
                    viewTransition
                    aria-label={`${market.title} 마켓 입장하기`}
                    className="col-span-2 flex min-h-11 w-full items-center justify-center whitespace-nowrap bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white @lg:col-span-1 @lg:w-auto"
                    style={{ clipPath: pixelBox() }}
                >
                    입장하기
                </Link>
            </div>
        </div>
    )
}
