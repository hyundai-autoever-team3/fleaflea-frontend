import type { CSSProperties } from 'react'
import type { Market } from '../model/types'

interface MarketCardProps {
    market : Market
    isHost : boolean
}





export function MarketCard({ market, isHost }: MarketCardProps) {
    return isHost ? <AwningCard market={market} /> : <BoardingPassCard market={market} />
}

// 마켓 이미지가 없으면 그라데이션 + 마스코트
function Cover({ imageUrl, className, imageClassName = 'object-cover' }: { imageUrl: string | null; className: string; imageClassName?: string }) {
    return (
        <div className={`overflow-hidden bg-[image:var(--gradient-dreamy)] ${className}`}>
            {imageUrl ? (
                <img src={imageUrl} alt="" className={`size-full ${imageClassName}`} />
            ) : (
                <img src="/mascot/flea.png" alt="" className="size-full object-contain p-6" />
            )}
        </div>
    )
}

// 조각의 위(top) 또는 아래(bottom) 변 양 끝 모서리에 반원 홈을 뚫는 마스크
const notchMask = (edge: 'top' | 'bottom', radius = 10): CSSProperties => {
    const y = edge === 'top' ? '0' : '100%'
    const mask = [`0 ${y}`, `100% ${y}`]
        .map((pos) => `radial-gradient(circle at ${pos}, transparent ${radius}px, black ${radius + 0.5}px)`)
        .join(', ')
    return { maskImage: mask, WebkitMaskImage: mask, maskComposite: 'intersect', WebkitMaskComposite: 'source-in' }
}

const scallopMask = 'radial-gradient(circle at 50% 100%, transparent 5px, black 5.5px)'

// 줄무늬 한 칸(36px)마다 물결 하나가 오도록 같은 주기로 반복
const AWNING_STRIPES = 'repeating-linear-gradient(90deg, var(--color-primary) 0 36px, white 36px 72px)'
const valanceMask = 'radial-gradient(circle at 50% 0, black 17.5px, transparent 18px)'

function AwningCard({ market }: { market: Market }) {
    return(
        <div className = "w-72">
            {/* 차양 */}
            <div className = "relative z-10 -mb-3 drop-shadow-sm">
                <div className = "h-8 rounded-t-3xl" style={{ background: AWNING_STRIPES }} />
                <div
                    className = "h-[18px]"
                    style={{ background: AWNING_STRIPES, maskImage: valanceMask, WebkitMaskImage: valanceMask, maskSize: '36px 100%', WebkitMaskSize: '36px 100%' }}
                />
            </div>

            {/* 가판대 본체 */}
            <div className="rounded-b-3xl bg-bg px-4 pb-5 pt-6 shadow-lg">
                <Cover imageUrl={market.imageUrl} className="aspect-square rounded-2xl" />
                <div className="mt-4 flex items-center gap-2 px-1">
                    <h3 className="truncate text-xl font-bold text-text-strong">{market.title}</h3>
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">HOST</span>
                </div>
                <p className="mt-1 line-clamp-2 px-1 text-body-03 text-text-muted">
                    {market.description ?? '소개글이 없어요'}
                </p>
                <div className="mt-4 flex justify-end px-1">
                    <button type="button" className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white">
                        입장하기
                    </button>
                </div>
            </div>
        </div>
    )
}

function BoardingPassCard({ market }: { market: Market }) {
    return (
        <div className="relative w-96 overflow-hidden rounded-3xl bg-[image:var(--gradient-dreamy)] px-4 pb-5 pt-4 shadow-lg">
            {/* 배경 장면: 별 */}
            <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold tracking-[0.3em] text-white/90">FLEA PASS</p>
                <span className="text-lg text-white/90">☾</span>
            </div>
            <span className="absolute left-36 top-5 size-1 rounded-full bg-white" />
            <span className="absolute right-16 top-4 size-1.5 rounded-full bg-white/80" />
            {/* 탑승권 */}
            <div className="relative mt-3 drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)]">
                <div className="rounded-t-2xl bg-bg px-4 pb-4 pt-4" style={notchMask('bottom', 12)}>
                    <Cover imageUrl={market.imageUrl} className="aspect-square rounded-xl" imageClassName="object-contain p-10" />
                    <h3 className="mt-3 truncate px-1 text-xl font-bold text-text-strong">{market.title}</h3>
                    <p className="mt-1 line-clamp-2 px-1 text-body-03 text-text-muted">
                        {market.description ?? '소개글이 없어요'}
                    </p>
                </div>

                <div className="bg-bg px-5 pb-4 pt-3" style={notchMask('top', 12)}>
                    <div className="flex justify-end border-t border-dashed border-border pt-3">
                        <button type="button" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
                            입장하기
                        </button>
                    </div>
                </div>

                {/* 톱니 모양 아래 테두리 */}
                <div
                    className="h-2.5 bg-bg"
                    style={{ maskImage: scallopMask, WebkitMaskImage: scallopMask, maskSize: '16px 100%', WebkitMaskSize: '16px 100%' }}
                />
            </div>
        </div>
    )
}
