import { MASCOTS } from '../../config/mascots'
import { pixelBox } from '../../lib/pixel'
import { TapeStrip } from '../doodle'
import { Photo } from '../photo'

interface PolaroidPhotoProps {
  imageUrl: string | null
  statusLabel?: string
}

export function PolaroidPhoto({ imageUrl, statusLabel }: PolaroidPhotoProps) {
  const isClosed = statusLabel !== undefined

  return (
    <div className="relative mx-auto w-full max-w-[360px] px-5 py-6">
      {/* 테이프는 액자의 clip-path 바깥에 둔다 — 안에 넣으면 잘려서 안 보인다 */}
      <TapeStrip className="absolute left-1/2 top-2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3" />

      {/* 픽셀 테두리와 그림자가 흰 필름지의 윤곽을 잡는다. 액자는 기울이지 않는다 */}
      <div
        style={{ clipPath: pixelBox(4) }}
        className="bg-primary-tint p-[2px] drop-shadow-[0_16px_28px_rgba(0,0,0,0.30)]"
      >
        <div style={{ clipPath: pixelBox(4) }} className="relative bg-white p-3 pb-14">
          <div
            style={{ clipPath: pixelBox(2) }}
            className="relative flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
          >
            {/* 저장소에서 사라진 사진은 주소만 남아 깨진 그림으로 나온다.
                주소가 있어도 실제로 받지 못하면 마스코트로 대신한다 */}
            <Photo
              src={imageUrl}
              fallback={MASCOTS.default}
              className={`size-full object-cover ${isClosed ? 'blur-sm' : ''}`}
              fallbackClassName="h-28"
            />
            {isClosed && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-head-03 font-bold text-white">
                {statusLabel}
              </span>
            )}
          </div>
          {/* 아래 빈 여백 오른쪽에 마스코트를 작게 — 폴라로이드에 사인하듯 */}
          <img draggable={false}
            src={MASCOTS.star}
            alt=""
            className="absolute bottom-3 right-4 h-7 select-none object-contain [image-rendering:pixelated]"
          />
        </div>
      </div>
    </div>
  )
}
