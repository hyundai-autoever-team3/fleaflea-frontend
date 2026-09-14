import { useEffect, useRef } from 'react'

const STAGGER_STEP_MS = 200

/**
 * 컨테이너가 뷰포트에 20% 이상 들어오면, 내부의 [data-reveal-item] 자식들을 DOM 순서대로
 * 0.2초 간격으로 순차 등장시킨다. 자식 요소는 querySelectorAll로 그때그때 찾기 때문에
 * 카드 개수나 내용이 나중에 바뀌어도 이 훅/CSS는 그대로 재사용 가능하다.
 * prefers-reduced-motion이면 애니메이션 없이 바로 보이는 상태로 둔다.
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        items.forEach((item, index) => {
          item.style.setProperty('--reveal-delay', `${index * STAGGER_STEP_MS}ms`)
          item.classList.add('is-visible')
        })
        observer.unobserve(el)
      },
      { threshold: 0.2 },
    )
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return ref
}
