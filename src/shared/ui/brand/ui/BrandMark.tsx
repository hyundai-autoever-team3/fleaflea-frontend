import { MASCOTS } from '../../../config/mascots'

export function BrandMark() {
  return (
    <>
      <div className="size-8 shrink-0 overflow-hidden rounded-full">
        <img
          draggable={false}
          src={MASCOTS.default}
          alt=""
          className="h-full w-full object-cover [image-rendering:pixelated]"
        />
      </div>
      <span className="font-jua text-head-03 text-text-strong">FleaFlea</span>
    </>
  )
}
