import { MASCOTS, pickMascot } from '../../../shared/config/mascots'
import { pixelBox, pixelCorners } from '../../../shared/lib/pixel'
import { Photo } from '../../../shared/ui/photo'

interface MarketCoverProps {
  coverImageUrl: string | null
  className?: string
  marketId?: number
  // window는 목록 카드의 창틀, bare는 상세 화면의 커버 이미지에 사용한다.
  variant?: 'window' | 'bare'
}

// 커버가 없으면 마켓 ID로 고른 마스코트를 사용해 같은 마켓의 대체 이미지를 유지한다.
export function MarketCover({
  coverImageUrl,
  className = '',
  marketId,
  variant = 'window',
}: MarketCoverProps) {
  const fallbackMascot = marketId === undefined ? MASCOTS.default : pickMascot(marketId)

  if (variant === 'bare') {
    return (
      <div className={`overflow-hidden bg-[image:var(--gradient-dreamy)] ${className}`}>
        <Photo
          src={coverImageUrl}
          fallback={fallbackMascot}
          className="size-full object-cover"
          fallbackClassName="size-full p-10"
        />
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
