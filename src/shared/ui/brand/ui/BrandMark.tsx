import { MASCOTS } from '../../../config/mascots'

// 랜딩과 로그인 이후 화면이 같은 자리에 서로 다른 마크를 두고 있었다.
// 같은 서비스인데 첫 화면과 다음 화면의 왼쪽 위가 달라 보이면 안 되므로 한 곳에서만 그린다
export function BrandMark() {
  return (
    <>
      <div className="size-8 shrink-0 overflow-hidden rounded-full">
        <img draggable={false} src={MASCOTS.default} alt="" className="h-full w-full object-cover [image-rendering:pixelated]" />
      </div>
      <span className="font-jua text-head-03 text-text-strong">FleaFlea</span>
    </>
  )
}
