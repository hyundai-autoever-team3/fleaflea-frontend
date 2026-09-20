// 문자열 그리드를 <rect>로 그리는 픽셀 스프라이트 (design.md 3장).
// 아이콘 라이브러리의 가는 외곽선 대신 이 방식을 쓰면 계단 모서리·마스코트와 결이 맞는다
export function Sprite({ rows, className = '' }: { rows: readonly string[]; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {rows.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  )
}
