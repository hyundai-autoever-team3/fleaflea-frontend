import type { CSSProperties } from 'react'

import { pixelCorners } from '../../../shared/lib/pixel'

// 반지름을 타일 비율(%)로 잡아 round 반복으로 타일이 늘어나도 줄무늬 폭과 반원이 같이 늘어나게 함
const valanceMask =
  'radial-gradient(25% 100% at 25% 0, black 98%, transparent 100%), radial-gradient(25% 100% at 75% 0, black 98%, transparent 100%)'

interface AwningProps {
  color: string
  stripeColor: string
}

// 줄무늬 2칸(120px) 타일을 round로 반복해 폭이 달라도 끝에서 줄무늬·물결이 잘리지 않게 맞춤.
// 물결(30px) 아래로 본체가 파고들도록 -mb-[30px]을 갖고 있으니, 본체 쪽에서 pt로 그만큼 비워야
// 페이지 배경이 틈으로 비치지 않음
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
