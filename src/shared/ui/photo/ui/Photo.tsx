import { useState } from 'react'

// 한 번 실패한 주소는 모듈 전역에 기억해 둔다.
// 삭제된 이미지(403)는 몇 번을 요청해도 실패하는데, 목록을 스크롤하면
// 줄이 화면에 들어올 때마다 요청이 새로 나가 네트워크와 콘솔이 오류로 가득 찬다
const failedUrls = new Set<string>()

interface PhotoProps {
  src: string | null
  // 사진이 없거나 받아오지 못했을 때 대신 보여줄 그림 (마스코트)
  fallback: string
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function Photo({ src, fallback, alt = '', className = '', fallbackClassName = '' }: PhotoProps) {
  const [, forceRender] = useState(0)
  const usable = src && !failedUrls.has(src) ? src : null

  if (!usable) {
    return <img src={fallback} alt={alt} className={`object-contain [image-rendering:pixelated] ${fallbackClassName}`} />
  }

  return (
    <img
      src={usable}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => {
        failedUrls.add(usable)
        forceRender((count) => count + 1)
      }}
      className={className}
    />
  )
}
