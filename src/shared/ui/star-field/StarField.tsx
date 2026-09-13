/** 별 텍스처 — 실제 별자리 일러스트 대신 반복 radial-gradient로 흉내낸 점묘 효과.
 * 우주 임팩트 배경(design.md 6장 예외 조항) 위에 겹쳐서 사용. */
export function StarField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(1.5px 1.5px at 20% 30%, white, transparent), radial-gradient(1.5px 1.5px at 70% 15%, white, transparent), radial-gradient(1px 1px at 40% 70%, white, transparent), radial-gradient(1.5px 1.5px at 85% 60%, white, transparent), radial-gradient(1px 1px at 55% 45%, white, transparent), radial-gradient(1px 1px at 10% 80%, white, transparent), radial-gradient(1.5px 1.5px at 92% 85%, white, transparent)',
        opacity: 0.6,
      }}
    />
  )
}
