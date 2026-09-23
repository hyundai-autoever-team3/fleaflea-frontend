import { useEffect, useRef } from 'react'

const STAGGER_STEP_MS = 200

/**
 * 컨테이너가 화면 가운데 띠에 닿으면, 내부의 [data-reveal-item] 자식들을 DOM 순서대로
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

    // 띠를 벗어나면 표시를 걷어, 다시 들어올 때 순서대로 다시 등장하게 한다
    const observer = new IntersectionObserver(
      ([entry]) => {
        items.forEach((item, index) => {
          item.style.setProperty('--reveal-delay', `${index * STAGGER_STEP_MS}ms`)
          item.classList.toggle('is-visible', entry.isIntersecting)
        })
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
