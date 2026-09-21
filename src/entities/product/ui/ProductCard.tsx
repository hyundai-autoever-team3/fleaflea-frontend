import { Link } from 'react-router'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Photo } from '../../../shared/ui/photo'
import { formatProductPrice, getStatusTagLabel, TRADE_TYPE_LABEL } from '../model/trade'
import type { ProductSummary } from '../model/types'

interface ProductCardProps {
  product: ProductSummary
  backTarget?: { to: string; label: string }
}

export function ProductCard({ product, backTarget }: ProductCardProps) {
  const isClosed = product.status !== 'AVAILABLE'

  return (
    <Link
      to={`/items/${product.itemId}`}
      state={backTarget ? { from: backTarget } : undefined}
      viewTransition
      className="block drop-shadow-[0_6px_14px_rgba(0,0,0,0.08)]"
    >
      {/* 픽셀 테두리: 바깥 연보라 판 + 안쪽 카드 면 */}
      <div style={{ clipPath: pixelBox(4) }} className="bg-primary-tint p-[2px]">
        <div style={{ clipPath: pixelBox(4) }} className="bg-bg p-3">
          <div
            style={{ clipPath: pixelBox(3) }}
            className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-primary-subtle"
          >
            <Photo
              src={product.imageUrl}
              fallback={MASCOTS.default}
              className="size-full object-cover"
              fallbackClassName="h-16"
            />
            {isClosed && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-body-03 font-bold text-white">
                {getStatusTagLabel(product.status, product.tradeType)}
              </span>
            )}
          </div>

          <span className="mt-3 inline-block bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary" style={{ clipPath: pixelBox(2) }}>
            {TRADE_TYPE_LABEL[product.tradeType]}
          </span>
          <h3 className="mt-1.5 truncate text-body-03 font-bold text-text-strong">{product.title}</h3>
          <p className="mt-0.5 text-body-04 text-text-muted">{formatProductPrice(product)}</p>
        </div>
      </div>
    </Link>
  )
}
