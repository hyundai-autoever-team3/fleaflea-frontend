import { useState } from 'react'

import { MASCOTS } from '../../../config/mascots'
import { pixelBox } from '../../../lib/pixel'

// 촘촘한 칩(xs), 줄 안의 작은 아바타(sm), 목록 줄(md), 프로필 카드·모달(lg).
// 계단 모서리 단계는 크기에 맞춰 함께 키운다 — 작은 칸에 큰 계단을 주면 형태가 뭉개진다
const SIZES = {
  xs: { box: 'size-7', step: 2 },
  sm: { box: 'size-8', step: 2 },
  md: { box: 'size-12', step: 2 },
  lg: { box: 'size-20', step: 3 },
} as const

interface AvatarProps {
  profileImageUrl: string | null
  size?: keyof typeof SIZES
  className?: string
}

// 프로필 사진 한 칸. 사진이 없거나 불러오지 못하면 마스코트로 대체한다
export function Avatar({ profileImageUrl, size = 'md', className = '' }: AvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const { box, step } = SIZES[size]
  const hasPhoto = Boolean(profileImageUrl) && profileImageUrl !== failedUrl

  return (
    <span
      style={{ clipPath: pixelBox(step) }}
      className={`block shrink-0 overflow-hidden bg-primary-subtle ${box} ${className}`}
    >
      {hasPhoto ? (
        <img
          src={profileImageUrl as string}
          alt=""
          onError={() => setFailedUrl(profileImageUrl)}
          className="size-full object-cover"
        />
      ) : (
        // 마스코트는 잘리면 표정이 사라지므로 contain으로 넣고, 픽셀이 흐려지지 않게 렌더링을 고정
        <img src={MASCOTS.default} alt="" className="size-full object-contain [image-rendering:pixelated]" />
      )}
    </span>
  )
}
