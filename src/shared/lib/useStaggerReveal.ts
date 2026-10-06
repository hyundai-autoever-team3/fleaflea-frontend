import { useEffect, useRef } from 'react'

const STAGGER_STEP_MS = 200

/**
 * 컨테이너가 뷰포트 중앙에 진입하면 자식들을 DOM 순서대로 0.2초 간격으로 표시한다.
 * 마운트 시 존재하는 [data-reveal-item]만 대상으로 하며, 동작 줄이기 설정에서는 즉시 표시한다.
 */
export function useStaggerReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal-item]'))
    if (items.length === 0) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'))
      return
    }

    // 재진입 시에도 같은 순서와 간격으로 애니메이션을 재생한다.
    const observer = new IntersectionObserver(
      ([entry]) => {
        items.forEach((item, index) => {
          item.style.setProperty('--reveal-delay', `${index * STAGGER_STEP_MS}ms`)
          item.classList.toggle('is-visible', entry.isIntersecting)
        })
      },
      // 긴 컨테이너도 진입을 감지할 수 있도록 요소의 노출 비율 대신 뷰포트 영역을 사용한다.
      { threshold: 0, rootMargin: '-20% 0px -20% 0px' },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return ref
}
