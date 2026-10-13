import { useEffect, useState } from 'react'

// 화면 키보드가 이만큼 이상 화면을 가리면 키보드가 올라온 것으로 본다
const KEYBOARD_MIN_HEIGHT = 120

// 아이폰은 키보드가 올라와도 페이지 높이(100dvh)를 줄이지 않고, 키보드로 가려진 만큼
// 화면을 통째로 위로 밀어 올린다. 그러면 위쪽 내용이 화면 밖으로 나가고 입력창 아래에 빈 자리가 남는다.
// 실제로 보이는 영역(visualViewport)의 높이를 돌려줘, 화면이 그 높이에 맞춰 다시 짜이게 한다.
// 키보드가 없으면 null을 돌려준다. 안드로이드는 페이지 높이가 알아서 줄어 항상 null이다
export function useKeyboardViewportHeight(enabled: boolean) {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!enabled || !viewport) return

    function update() {
      if (!viewport) return

      // 두 손가락으로 확대한 경우에도 보이는 영역이 줄어든다. 그때는 키보드로 보지 않는다
      const zoomed = Math.abs(viewport.scale - 1) > 0.01
      const open = !zoomed && window.innerHeight - viewport.height > KEYBOARD_MIN_HEIGHT

      setHeight(open ? viewport.height : null)
      // 브라우저가 입력칸을 보여 주려고 밀어 올린 스크롤을 되돌린다
      if (open) window.scrollTo(0, 0)
    }

    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)

    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [enabled])

  return enabled ? height : null
}
