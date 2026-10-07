import type { CSSProperties } from 'react'

import { pixelCorners } from '../../../shared/lib/pixel'

// round 반복으로 타일 폭이 바뀌어도 반원이 줄무늬에 맞도록 상대 반지름을 사용한다.
const valanceMask =
  'radial-gradient(25% 100% at 25% 0, black 98%, transparent 100%), radial-gradient(25% 100% at 75% 0, black 98%, transparent 100%)'

interface AwningProps {
  color: string
  stripeColor: string
}

// 차양이 카드 본문과 30px 겹치므로 본문에는 그만큼의 상단 여백이 필요하다.
export function Awning({ color, stripeColor }: AwningProps) {
  const tile: CSSProperties = {
    backgroundImage: `linear-gradient(90deg, ${color} 50%, ${stripeColor} 50%)`,
    backgroundSize: '120px 100%',
    backgroundRepeat: 'round',
  }

  return (
    <div className="relative z-10 -mb-[30px] drop-shadow-sm">
      <div className="h-8" style={{ ...tile, clipPath: pixelCorners('top') }} />
      <div
        className="h-[30px]"
        style={{
          ...tile,
          maskImage: valanceMask,
          WebkitMaskImage: valanceMask,
          maskSize: '120px 100%',
          WebkitMaskSize: '120px 100%',
          maskRepeat: 'round',
          WebkitMaskRepeat: 'round',
        }}
      />
    </div>
  )
}
