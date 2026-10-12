import type { ReactNode } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'

// 소셜 로그인 결과 화면들이 함께 쓰는 가운데 카드. 초대 참여 화면과 같은 모양이다.
export function AuthCard({
  mascot,
  title,
  description,
  children,
}: {
  mascot: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary-subtle p-6">
      <div className="w-full max-w-md drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
        <div style={{ clipPath: pixelBox(6) }} className="bg-bg px-8 py-10 text-center">
          <img
            draggable={false}
            src={mascot}
            alt=""
            className="mx-auto h-24 object-contain [image-rendering:pixelated]"
          />

          <h1 className="mt-4 text-head-03 font-bold text-text-strong">{title}</h1>
          {description && <p className="mt-2 text-body-03 text-text-muted">{description}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}
