import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { pixelBox, pixelCorners } from '../../../shared/lib/pixel'
import type { MarketSummary } from '../model/types'
import { MarketCover } from './MarketCover'

interface MarketCardProps {
    market : MarketSummary
    isHost : boolean
}

export function MarketCard({ market, isHost }: MarketCardProps) {
    return <AwningCard market={market} isHost={isHost} />
}

// 반지름을 타일 비율(%)로 잡아 round 반복으로 타일이 늘어나도 줄무늬 폭과 반원이 같이 늘어나게 함
const valanceMask = 'radial-gradient(25% 100% at 25% 0, black 98%, transparent 100%), radial-gradient(25% 100% at 75% 0, black 98%, transparent 100%)'

// 줄무늬 2칸(120px) 타일을 round로 반복해 카드 폭이 달라도 끝에서 줄무늬·물결이 잘리지 않게 맞춤
function Awning({ color, stripeColor }: { color: string; stripeColor: string }) {
    const tile: CSSProperties = {
        backgroundImage: `linear-gradient(90deg, ${color} 50%, ${stripeColor} 50%)`,
        backgroundSize: '120px 100%',
        backgroundRepeat: 'round',
    }
    return (
        <div className = "relative z-10 -mb-[30px] drop-shadow-sm">
            <div className = "h-8" style={{ ...tile, clipPath: pixelCorners('top') }} />
            <div
                className = "h-[30px]"
                style={{ ...tile, maskImage: valanceMask, WebkitMaskImage: valanceMask, maskSize: '120px 100%', WebkitMaskSize: '120px 100%', maskRepeat: 'round', WebkitMaskRepeat: 'round' }}
            />
        </div>
    )
}

function AwningCard({ market, isHost }: { market: MarketSummary; isHost: boolean }) {
    return(
        <div className = "w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <Awning color="var(--color-primary-tint)" stripeColor="#f2f3f6" />

            {/* 가판대 본체: 쇼윈도 | 소개 | 입장 */}
            <div className="flex items-center gap-6 bg-bg px-6 pb-10 pt-14" style={{ clipPath: pixelCorners('bottom') }}>
                <MarketCover coverImageUrl={market.coverImageUrl} marketId={market.marketId} className="w-44 shrink-0" />

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate text-2xl font-bold text-text-strong">{market.title}</h3>
                        {isHost && (
                            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">HOST</span>
                        )}
                    </div>
                    <p className="mt-2 line-clamp-2 text-body-02 text-text-muted">
                        {market.description || '소개글이 없어요'}
                    </p>
                    {!isHost && (
                        <p className="mt-2 text-body-04 text-text-muted">호스트 {market.hostNickname}</p>
                    )}
                </div>

                <Link to={`/market/${market.marketId}`} viewTransition className="shrink-0 bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white" style={{ clipPath: pixelBox() }}>
                    입장하기
                </Link>
            </div>
        </div>
    )
}
