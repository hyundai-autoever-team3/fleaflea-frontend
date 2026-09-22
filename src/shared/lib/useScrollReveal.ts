import { useEffect, useRef } from 'react'

/**
 * 요소가 화면 가운데 띠에 닿으면 딱 한 번 등장 애니메이션(opacity/translateY)을 재생한다.
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
      // 화면 위아래 20%를 잘라낸 가운데 띠에 닿을 때 재생한다.
      // 요소 넓이의 20%가 보이면(threshold) 바로 켜지게 두었더니, 스냅 스크롤이
      // 자리를 잡기도 전에 애니메이션이 끝나 효과가 보이지 않았다.
      // 띠로 재면 섹션 길이와 상관없이 같은 지점에서 켜진다 — 길쭉한 섹션이
      // threshold를 영영 못 넘겨 내용이 안 보이게 되는 일도 없다
      { threshold: 0, rootMargin: '-20% 0px -20% 0px' },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return ref
}
