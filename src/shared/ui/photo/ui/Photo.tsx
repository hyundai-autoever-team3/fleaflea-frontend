import { useState } from 'react'

// 여러 카드에서 실패한 이미지 주소를 반복 요청하지 않도록 잠시 공유한다.
// 30초가 지난 뒤 다시 렌더링되면 재시도해 일시적인 네트워크 오류에서도 복구할 수 있다.
const FORGET_AFTER_MS = 30_000
const failedAt = new Map<string, number>()

function hasFailedRecently(url: string) {
  const at = failedAt.get(url)

  if (at === undefined) return false
  if (Date.now() - at < FORGET_AFTER_MS) return true

  failedAt.delete(url)

  return false
}

interface PhotoProps {
  src: string | null
  // 주소가 없거나 최근 로딩에 실패했을 때 표시할 이미지.
  fallback: string
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function Photo({
  src,
  fallback,
  alt = '',
  className = '',
  fallbackClassName = '',
}: PhotoProps) {
  const [, forceRender] = useState(0)
  const usable = src && !hasFailedRecently(src) ? src : null

  if (!usable) {
    return (
      <img
        draggable={false}
        src={fallback}
        alt={alt}
        className={`object-contain [image-rendering:pixelated] ${fallbackClassName}`}
      />
    )
  }

  return (
    <img
      draggable={false}
      src={usable}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        failedAt.set(usable, Date.now())
        forceRender((count) => count + 1)
      }}
      className={className}
    />
  )
}
