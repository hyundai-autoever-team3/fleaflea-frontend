import { useEffect, useState } from 'react'

// 보이는 영역이 평소보다 이만큼 이상 줄면 화면 키보드가 올라온 것으로 본다
const KEYBOARD_MIN_HEIGHT = 120

// 아이폰은 키보드가 올라와도 페이지 높이(100dvh)를 그대로 두고, 가려진 만큼 화면을 위로 밀어 올린다.
// 그러면 위쪽 내용이 화면 밖으로 나가고 입력창 위치가 어긋난다.
// 실제로 보이는 영역(visualViewport)의 높이를 돌려줘 화면이 그 높이에 맞춰 다시 짜이게 한다.
// 키보드가 없으면 null을 돌려준다
export function useKeyboardViewportHeight(enabled: boolean) {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!enabled || !viewport) return

    // 키보드가 없을 때의 높이. 창 높이(innerHeight)와 비교하지 않는 이유는, 기기와 실행 방식에 따라
    // 키보드가 올라올 때 창 높이도 같이 줄어드는 경우가 있어 차이가 0으로 나오기 때문이다
    let fullHeight = viewport.height

    function update() {
      if (!viewport) return

      // 두 손가락으로 확대한 경우에도 보이는 영역이 줄어든다. 그때는 키보드로 보지 않는다
      if (Math.abs(viewport.scale - 1) > 0.01) return

      fullHeight = Math.max(fullHeight, viewport.height)
      const open = fullHeight - viewport.height > KEYBOARD_MIN_HEIGHT

      setHeight(open ? viewport.height : null)
      // 브라우저가 입력칸을 보여 주려고 밀어 올린 스크롤을 되돌린다
      if (open) window.scrollTo(0, 0)
    }

    // 기기를 돌리면 기준 높이가 달라지므로 다시 잰다
    function reset() {
      if (viewport) fullHeight = viewport.height
      setHeight(null)
    }

    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    window.addEventListener('orientationchange', reset)

    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', reset)
    }
  }, [enabled])

  return enabled ? height : null
}
