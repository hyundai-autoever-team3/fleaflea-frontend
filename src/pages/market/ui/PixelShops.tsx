// 14x11 픽셀 상점. k=외곽선 a=차양 w=흰 줄무늬 b=벽 g=창문 d=문
const SHOP_SPRITE = [
  '..kkkkkkkkkk..',
  '.kawawawawawk.',
  'kwawawawawawak',
  'kkkkkkkkkkkkkk',
  '.kbbbbbbbbbbk.',
  '.kbkkkbbkkkbk.',
  '.kbkgkbbkdkbk.',
  '.kbkkkbbkdkbk.',
  '.kbbbbbbkdkbk.',
  '.kbbbbbbkdkbk.',
  'kkkkkkkkkkkkkk',
]

const INK = 'var(--navy-900)'

const SHOPS = [
  { awning: '#f49ac1', door: '#f49ac1', scale: 3 },
  { awning: 'var(--color-primary)', door: 'var(--color-primary)', scale: 4 },
  { awning: '#8fb8f0', door: '#8fb8f0', scale: 3 },
]

function PixelShop({ awning, door, scale }: (typeof SHOPS)[number]) {
  const palette: Record<string, string> = { k: INK, a: awning, w: '#ffffff', b: '#ffffff', g: '#cfe8f7', d: door }
  const width = SHOP_SPRITE[0].length
  const height = SHOP_SPRITE.length

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width * scale}
      height={height * scale}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {SHOP_SPRITE.flatMap((row, y) =>
        [...row].map((cell, x) =>
          cell === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[cell]} />,
        ),
      )}
    </svg>
  )
}

export function PixelShops({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      {SHOPS.map((shop, i) => (
        <PixelShop key={i} {...shop} />
      ))}
    </div>
  )
}
