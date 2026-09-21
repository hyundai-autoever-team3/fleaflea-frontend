import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Photo } from '../../../shared/ui/photo'

interface PreviewSlotProps {
  label: string
  title?: string
  imageUrl?: string | null
}

// 요청 화면들이 공통으로 쓰는 미리보기 칸 — 대여·교환·구걸이 같은 칸 문법을 쓰도록 한곳에 둔다.
// 사진이 없으면 마스코트, 아직 고르지 않았으면 빈 칸으로 보인다
export function PreviewSlot({ label, title, imageUrl }: PreviewSlotProps) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1.5 truncate text-center text-xs font-bold text-text-muted">{label}</p>
      <div style={{ clipPath: pixelBox(3) }} className="bg-primary-tint p-[2px]">
        <div
          style={{ clipPath: pixelBox(3) }}
          className="flex aspect-square items-center justify-center overflow-hidden bg-bg"
        >
          <Photo
            src={imageUrl ?? null}
            fallback={title ? MASCOTS.default : MASCOTS.basket}
            className="size-full object-cover"
            fallbackClassName="h-1/2 opacity-60"
          />
        </div>
      </div>
      <p className="mt-1.5 truncate text-center text-body-04 font-bold text-text-strong">{title ?? '아직 안 골랐어요'}</p>
    </div>
  )
}
