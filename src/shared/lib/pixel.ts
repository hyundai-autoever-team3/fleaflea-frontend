// 마스코트 픽셀 아트처럼 위(top) 또는 아래(bottom) 양 끝 모서리를 계단 3칸으로 깎는 clip-path
export function pixelCorners(edge: 'top' | 'bottom', step = 6): string {
  const s = (n: number) => `${n * step}px`
  const far = (n: number) => `calc(100% - ${n * step}px)`
  if (edge === 'top') {
    return `polygon(0 ${s(3)}, ${s(1)} ${s(3)}, ${s(1)} ${s(2)}, ${s(2)} ${s(2)}, ${s(2)} ${s(1)}, ${s(3)} ${s(1)}, ${s(3)} 0, ${far(3)} 0, ${far(3)} ${s(1)}, ${far(2)} ${s(1)}, ${far(2)} ${s(2)}, ${far(1)} ${s(2)}, ${far(1)} ${s(3)}, 100% ${s(3)}, 100% 100%, 0 100%)`
  }
  return `polygon(0 0, 100% 0, 100% ${far(3)}, ${far(1)} ${far(3)}, ${far(1)} ${far(2)}, ${far(2)} ${far(2)}, ${far(2)} ${far(1)}, ${far(3)} ${far(1)}, ${far(3)} 100%, ${s(3)} 100%, ${s(3)} ${far(1)}, ${s(2)} ${far(1)}, ${s(2)} ${far(2)}, ${s(1)} ${far(2)}, ${s(1)} ${far(3)}, 0 ${far(3)})`
}

// 같은 step이면 결과가 늘 같은 문자열이라 한 번만 만들어 재사용한다.
// 목록 한 화면에 수십 개가 깔리는데, 렌더마다 20개 꼭짓점 문자열을 새로 만들 이유가 없다.
// 같은 참조를 돌려주므로 인라인 style 객체 비교도 싸진다
const boxCache = new Map<number, string>()

// 네 모서리를 계단 2칸으로 깎는 clip-path (버튼·탭용)
export function pixelBox(step = 3): string {
  const cached = boxCache.get(step)
  if (cached !== undefined) return cached
  const built = buildPixelBox(step)
  boxCache.set(step, built)
  return built
}

function buildPixelBox(step: number): string {
  const s = (n: number) => `${n * step}px`
  const far = (n: number) => `calc(100% - ${n * step}px)`
  return `polygon(${s(2)} 0, ${far(2)} 0, ${far(2)} ${s(1)}, ${far(1)} ${s(1)}, ${far(1)} ${s(2)}, 100% ${s(2)}, 100% ${far(2)}, ${far(1)} ${far(2)}, ${far(1)} ${far(1)}, ${far(2)} ${far(1)}, ${far(2)} 100%, ${s(2)} 100%, ${s(2)} ${far(1)}, ${s(1)} ${far(1)}, ${s(1)} ${far(2)}, 0 ${far(2)}, 0 ${s(2)}, ${s(1)} ${s(2)}, ${s(1)} ${s(1)}, ${s(2)} ${s(1)})`
}
