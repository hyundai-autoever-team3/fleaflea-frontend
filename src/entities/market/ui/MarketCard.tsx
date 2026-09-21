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
        <div className = "w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <Awning color="var(--color-primary-tint)" stripeColor="#f2f3f6" />

            {/* 가판대 본체: 쇼윈도 | 소개 | 입장 */}
            <div className="flex items-center gap-5 bg-bg px-6 pb-8 pt-12" style={{ clipPath: pixelCorners('bottom') }}>
                <MarketCover coverImageUrl={market.coverImageUrl} marketId={market.marketId} className="w-36 shrink-0" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-xl font-bold text-text-strong">{market.title}</h3>
                        {isHost && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">HOST</span>
                        )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-body-03 text-text-muted">
                        {market.description || '소개글이 없어요'}
                    </p>
                    {/* 제목 옆 HOST는 "내가 연 마켓"이라는 표시라 진하게 둔다.
                        여기 HOST는 누가 호스트인지 알려주는 이름표일 뿐이라,
                        같은 색이면 둘이 같은 뜻으로 읽힌다. 옆 글자 무게에 맞춰 연하게 */}
                    {!isHost && (
                        <p className="mt-2 flex items-center gap-2 text-body-04 text-text-muted">
                            <span className="shrink-0 rounded-full bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary">
                                HOST
                            </span>
                            <span className="truncate">{market.hostNickname}</span>
                        </p>
                    )}
                </div>

                <Link to={`/market/${market.marketId}`} viewTransition className="shrink-0 bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white" style={{ clipPath: pixelBox() }}>
                    입장하기
                </Link>
            </div>
        </div>
    )
}
