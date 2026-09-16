// 마스코트 픽셀 아트처럼 위(top) 또는 아래(bottom) 양 끝 모서리를 계단 3칸으로 깎는 clip-path
export function pixelCorners(edge: 'top' | 'bottom', step = 6): string {
  const s = (n: number) => `${n * step}px`
  const far = (n: number) => `calc(100% - ${n * step}px)`
  if (edge === 'top') {
    return `polygon(0 ${s(3)}, ${s(1)} ${s(3)}, ${s(1)} ${s(2)}, ${s(2)} ${s(2)}, ${s(2)} ${s(1)}, ${s(3)} ${s(1)}, ${s(3)} 0, ${far(3)} 0, ${far(3)} ${s(1)}, ${far(2)} ${s(1)}, ${far(2)} ${s(2)}, ${far(1)} ${s(2)}, ${far(1)} ${s(3)}, 100% ${s(3)}, 100% 100%, 0 100%)`
  }
  return `polygon(0 0, 100% 0, 100% ${far(3)}, ${far(1)} ${far(3)}, ${far(1)} ${far(2)}, ${far(2)} ${far(2)}, ${far(2)} ${far(1)}, ${far(3)} ${far(1)}, ${far(3)} 100%, ${s(3)} 100%, ${s(3)} ${far(1)}, ${s(2)} ${far(1)}, ${s(2)} ${far(2)}, ${s(1)} ${far(2)}, ${s(1)} ${far(3)}, 0 ${far(3)})`
}

// 네 모서리를 계단 2칸으로 깎는 clip-path (버튼·탭용)
export function pixelBox(step = 3): string {
  const s = (n: number) => `${n * step}px`
  const far = (n: number) => `calc(100% - ${n * step}px)`
  return `polygon(${s(2)} 0, ${far(2)} 0, ${far(2)} ${s(1)}, ${far(1)} ${s(1)}, ${far(1)} ${s(2)}, 100% ${s(2)}, 100% ${far(2)}, ${far(1)} ${far(2)}, ${far(1)} ${far(1)}, ${far(2)} ${far(1)}, ${far(2)} 100%, ${s(2)} 100%, ${s(2)} ${far(1)}, ${s(1)} ${far(1)}, ${s(1)} ${far(2)}, 0 ${far(2)}, 0 ${s(2)}, ${s(1)} ${s(2)}, ${s(1)} ${s(1)}, ${s(2)} ${s(1)})`
}
