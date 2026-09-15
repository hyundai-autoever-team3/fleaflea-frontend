import { Header } from '../../../widgets/header'

export function MarketPage() {
  return (
    <div>
      <Header />

      <div className="mx-auto max-w-*** px-6 py-8">
        {/* 히어로 — 마스코트 + 말풍선 */}
        <div className="relative min-h-96 overflow-hidden rounded-3xl bg-[image:var(--gradient-dreamy)] p-12">
          <span className="absolute left-9 top-18 inline-flex rounded-full bg-bg px-4 py-2 text-body-03 font-bold text-primary shadow-sm">
            참여 중인 마켓 3개
          </span>
          <h1 className="mt-20 max-w-[60%] text-head-00 font-bold text-text-strong">
            우리 동네 작은
            <br />
            마켓지기
          </h1>

          <div className="absolute right-8 top-32 max-w-56 rounded-2xl bg-bg px-4 py-3 text-body-03 text-text-muted shadow-md">
            마켓을 하나 더 열면 마켓지기 등업!
            <span className="absolute -bottom-1.5 left-8 size-3 rotate-45 bg-bg shadow-md" />
          </div>
          <div className="absolute bottom-6 right-16 h-4 w-28 rounded-full bg-black/15 blur-md" />
          <img
            src="/mascot/flea.png"
            alt=""
            className="absolute bottom-4 right-10 size-40 object-contain"
          />
        </div>
      </div>
    </div>
  )
}
