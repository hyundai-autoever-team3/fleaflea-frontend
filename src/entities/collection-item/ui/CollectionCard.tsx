import { LockClosedIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import type { CollectionItemSummary } from '../model/types'

interface CollectionCardProps {
  item: CollectionItemSummary
  onClick: () => void
}

export function CollectionCard({ item, onClick }: CollectionCardProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = item.imageUrl && item.imageUrl !== failedImageUrl ? item.imageUrl : null
  const visibilityLabel = item.isPublic ? '공개' : '비공개'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${item.title}, ${visibilityLabel}, 상세 보기`}
      className={`block w-full min-w-0 text-left drop-shadow-[0_6px_14px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:transform-none motion-reduce:transition-none ${item.isPublic ? '' : 'grayscale'}`}
    >
      <span style={{ clipPath: pixelBox(4) }} className="block bg-primary-tint p-[2px]">
        <span style={{ clipPath: pixelBox(4) }} className="block bg-bg p-3">
          <span
            style={{ clipPath: pixelBox(3) }}
            className="flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                loading="lazy"
                onError={() => setFailedImageUrl(imageUrl)}
                className="size-full object-cover"
              />
            ) : (
              <img src={MASCOTS.default} alt="" className="h-16 object-contain [image-rendering:pixelated]" />
            )}
          </span>

          <span title={item.title} className="mt-3 block truncate text-body-03 font-bold text-text-strong">
            {item.title}
          </span>
          <span
            style={{ clipPath: pixelBox(2) }}
            className="mt-2 inline-flex items-center gap-1 bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary"
          >
            {!item.isPublic && <LockClosedIcon aria-hidden="true" className="size-3" />}
            {visibilityLabel}
          </span>
        </span>
      </span>
    </button>
  )
}
