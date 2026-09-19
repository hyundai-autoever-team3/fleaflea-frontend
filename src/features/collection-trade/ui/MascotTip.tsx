import type { ReactNode } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'

// 왼쪽을 향한 계단 꼬리 — 마스코트가 말하는 것처럼 보이게 한다
const TAIL = ['..##', '.###', '####', '.###', '..##']

interface MascotTipProps {
  mascot: string
  children: ReactNode
  className?: string
}

// 요청 화면의 부연 설명을 마스코트의 말풍선으로 보여준다.
// 꼬리는 말풍선의 clip-path 바깥 형제로 둔다 — 안에 넣으면 잘려서 안 보인다
export function MascotTip({ mascot, children, className = '' }: MascotTipProps) {
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      <img src={mascot} alt="" className="h-9 shrink-0 object-contain [image-rendering:pixelated]" />
      <div className="relative min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${TAIL[0].length} ${TAIL.length}`}
          shapeRendering="crispEdges"
          fill="var(--color-bg)"
          aria-hidden
          className="absolute -left-1.5 top-2.5 w-2"
        >
          {TAIL.flatMap((row, y) =>
            [...row].map((cell, x) =>
              cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null,
            ),
          )}
        </svg>
        <div style={{ clipPath: pixelBox(3) }} className="bg-bg px-3 py-2">
          <p className="text-body-04 leading-relaxed text-text-muted">{children}</p>
        </div>
      </div>
    </div>
  )
}
