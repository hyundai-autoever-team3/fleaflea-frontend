import type { ReactNode } from 'react'

import { pixelBox } from '../../../lib/pixel'

interface PixelFieldProps {
  children: ReactNode
  invalid?: boolean
  className?: string
}

// 픽셀 모서리 입력칸 테두리. clip-path에 잘리는 inset 그림자 대신 같은 계단 모양의 바깥 판으로 테두리를 그림
export function PixelField({ children, invalid = false, className = '' }: PixelFieldProps) {
  return (
    <div
      style={{ clipPath: pixelBox() }}
      className={`p-[2px] transition-colors ${
        invalid ? 'bg-red-300' : 'bg-primary-subtle focus-within:bg-primary-tint'
      } ${className}`}
    >
      {children}
    </div>
  )
}
