import { useState } from 'react'

// 한 번 실패한 주소는 모듈 전역에 기억해 둔다.
// 삭제된 이미지(403)는 몇 번을 요청해도 실패하는데, 목록을 스크롤하면
// 줄이 화면에 들어올 때마다 요청이 새로 나가 네트워크와 콘솔이 오류로 가득 찬다.
//
// 다만 영영 기억하면 안 된다. 잠깐 끊겼거나 저장소에 늦게 올라온 사진이
// 새로고침 전까지 마스코트로 남아, 목록을 다시 받아도 원래 사진이 돌아오지 않는다.
// 잠시만 기억해 두었다가 잊고 다시 시도한다
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
  // 사진이 없거나 받아오지 못했을 때 대신 보여줄 그림 (마스코트)
  fallback: string
  alt?: string
  className?: string
  fallbackClassName?: string
}

export function Photo({ src, fallback, alt = '', className = '', fallbackClassName = '' }: PhotoProps) {
  const [, forceRender] = useState(0)
  const usable = src && !hasFailedRecently(src) ? src : null

  if (!usable) {
    return <img draggable={false} src={fallback} alt={alt} className={`object-contain [image-rendering:pixelated] ${fallbackClassName}`} />
  }

  return (
    <img draggable={false}
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
