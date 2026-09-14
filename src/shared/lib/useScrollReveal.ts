import { useEffect, useRef } from 'react'

/**
 * 요소가 뷰포트에 20% 이상 들어오면 딱 한 번 등장 애니메이션(opacity/translateY)을 재생한다.
 * 실제 트랜지션은 CSS([data-reveal].is-visible)에서 처리하고, 이 훅은 트리거 타이밍만 담당한다.
 * prefers-reduced-motion이면 애니메이션 없이 바로 보이는 상태로 둔다.
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.classList.add('is-visible')
        observer.unobserve(el)
      },
      { threshold: 0.2 },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return ref
}
