import { useState } from 'react'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import type { CollectionItemSummary } from '../model/types'

// '#'을 채워진 셀로 사용하는 7×8 자물쇠 도안.
const LOCK_SPRITE = [
  '..###..',
  '.#...#.',
  '.#...#.',
  '#######',
  '#######',
  '###.###',
  '###.###',
  '#######',
]

function PixelLock({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 7 8"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {LOCK_SPRITE.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null,
        ),
      )}
    </svg>
  )
}

// 등록 가능한 내 도감에서만 onClick을 전달해 빈 칸을 버튼으로 사용한다.
export function EmptySlot({ onClick }: { onClick?: () => void }) {
  if (!onClick) {
    return (
      <div
        aria-hidden
        style={{ clipPath: pixelBox(3) }}
        className="grid aspect-square w-full place-items-center bg-bg-subtle"
      >
        <PixelLock className="w-1/4 text-gray-400" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="빈 칸, 물건 등록하기"
      style={{ clipPath: pixelBox(3) }}
      className="grid aspect-square w-full place-items-center bg-bg-subtle transition-colors duration-200 hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <PixelLock className="w-1/4 text-gray-400" />
    </button>
  )
}

interface CollectionSlotProps {
  item: CollectionItemSummary
  onClick: () => void
}

export function CollectionSlot({ item, onClick }: CollectionSlotProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = item.imageUrl && item.imageUrl !== failedImageUrl ? item.imageUrl : null
  const visibilityLabel = item.isPublic ? '공개' : '비공개'

  return (
    <button
      type="button"
      onClick={onClick}
      title={item.title}
      aria-label={`${item.title}, ${visibilityLabel}, 상세 보기`}
      style={{ clipPath: pixelBox(3) }}
      className="relative block aspect-square w-full overflow-hidden bg-primary-subtle transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none"
    >
      {imageUrl ? (
        <img
          draggable={false}
          src={imageUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedImageUrl(imageUrl)}
          className="size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          <img
            draggable={false}
            src={MASCOTS.default}
            alt=""
            className="h-2/3 object-contain [image-rendering:pixelated]"
          />
        </span>
      )}

      {/* 비공개 물건도 소유자가 사진으로 식별할 수 있도록 자물쇠만 표시한다. */}
      {!item.isPublic && (
        <span
          style={{ clipPath: pixelBox(2) }}
          className="absolute right-1.5 top-1.5 grid size-7 place-items-center bg-black/55 text-white"
        >
          <PixelLock className="w-3.5" />
        </span>
      )}
    </button>
  )
}
