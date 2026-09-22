import { MASCOTS, pickMascot } from '../../../shared/config/mascots'
import { pixelBox, pixelCorners } from '../../../shared/lib/pixel'
import { Photo } from '../../../shared/ui/photo'

interface MarketCoverProps {
  coverImageUrl: string | null
  className?: string
  marketId?: number
  // window = 픽셀 테두리 + 창틀 + 창턱 (목록 카드)
  // bare  = 액자 없이 사진만 칸을 꽉 채움 (마켓 상세 — 커버 사진 자체를 크게 보여줄 때)
  variant?: 'window' | 'bare'
}

// 커버 이미지가 없으면 그라데이션 + 마켓마다 다른 마스코트
export function MarketCover({ coverImageUrl, className = '', marketId, variant = 'window' }: MarketCoverProps) {
  const fallbackMascot = marketId === undefined ? MASCOTS.default : pickMascot(marketId)

  if (variant === 'bare') {
    return (
      <div className={`overflow-hidden bg-[image:var(--gradient-dreamy)] ${className}`}>
        <Photo src={coverImageUrl} fallback={fallbackMascot} className="size-full object-cover" fallbackClassName="size-full p-10" />
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="bg-primary-tint p-[3px]" style={{ clipPath: pixelBox(4) }}>
        <div className="bg-primary-subtle p-2" style={{ clipPath: pixelBox(4) }}>
          <div
            className="aspect-square overflow-hidden bg-[image:var(--gradient-dreamy)]"
            style={{ clipPath: pixelBox(3) }}
          >
            <Photo
              src={coverImageUrl}
              fallback={fallbackMascot}
              className="size-full object-cover [image-rendering:pixelated]"
              fallbackClassName="size-full p-[15%]"
            />
          </div>
        </div>
      </div>
      <div className="-mx-1 h-2 bg-primary-tint" style={{ clipPath: pixelCorners('bottom', 2) }} />
    </div>
  )
}
