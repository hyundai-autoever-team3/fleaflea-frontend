interface TapeStripProps {
  className?: string
}

// 마스킹 테이프 — 폴라로이드 액자 모서리에 붙이는 반투명 조각.
// 액자에는 clip-path가 있어 자식이 잘리므로, 반드시 액자 바깥 형제로 두고 겹쳐 쓴다
export function TapeStrip({ className = '' }: TapeStripProps) {
  return (
    <span
      aria-hidden
      className={`block bg-primary-tint/70 shadow-[0_1px_2px_rgba(0,0,0,0.12)] ${className}`}
    />
  )
}
