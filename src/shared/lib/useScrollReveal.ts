import { useEffect, useRef } from 'react'

/**
 * 요소가 뷰포트 중앙 영역에 진입하면 CSS 등장 애니메이션을 시작한다.
 * 동작 줄이기 설정에서는 관찰하지 않고 즉시 표시한다.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    // 중앙 영역을 벗어나면 상태를 초기화해 재진입 시에도 애니메이션을 재생한다.
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.classList.toggle('is-visible', entry.isIntersecting)
      },
      // 요소의 노출 비율 대신 상하 여백을 줄인 관찰 영역에 닿는 시점을 기준으로 삼는다.
      { threshold: 0, rootMargin: '-20% 0px -20% 0px' },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return ref
}
