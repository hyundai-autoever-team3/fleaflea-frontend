import { MASCOTS, pickMascot } from '../../../shared/config/mascots'
import { pixelBox, pixelCorners } from '../../../shared/lib/pixel'

interface MarketCoverProps {
  coverImageUrl: string | null
  className?: string
  marketId?: number
}

// 가게 쇼윈도: 픽셀 테두리 + 창틀 + 창턱. 커버 이미지가 없으면 그라데이션 + 마켓마다 다른 마스코트
export function MarketCover({ coverImageUrl, className = '', marketId }: MarketCoverProps) {
  const fallbackMascot = marketId === undefined ? MASCOTS.default : pickMascot(marketId)

  return (
    <div className={className}>
      <div className="bg-primary-tint p-[3px]" style={{ clipPath: pixelBox(4) }}>
        <div className="bg-primary-subtle p-2" style={{ clipPath: pixelBox(4) }}>
          <div
            className="aspect-square overflow-hidden bg-[image:var(--gradient-dreamy)]"
            style={{ clipPath: pixelBox(3) }}
          >
            {coverImageUrl ? (
              <img src={coverImageUrl} alt="" className="size-full object-cover [image-rendering:pixelated]" />
            ) : (
              <img src={fallbackMascot} alt="" className="size-full object-contain p-6 [image-rendering:pixelated]" />
            )}
          </div>
        </div>
      </div>
      <div className="-mx-1 h-2 bg-primary-tint" style={{ clipPath: pixelCorners('bottom', 2) }} />
    </div>
  )
}
