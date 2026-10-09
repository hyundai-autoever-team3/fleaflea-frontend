import type { ReactNode } from 'react'
import { HandRaisedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'

// 실제 서비스의 색과 모서리를 공유하는 설명용 화면. 예시 데이터만 사용한다.
function PreviewFrame({
  section,
  caption,
  children,
}: {
  section: string
  caption: string
  children: ReactNode
}) {
  return (
    <figure className="mx-auto w-full max-w-xl min-w-0 text-left">
      <div className="drop-shadow-lg">
        <div className="overflow-hidden rounded-3xl bg-primary-tint p-[2px]">
          <div className="overflow-hidden rounded-[22px] bg-bg">
            <div className="flex items-center justify-between gap-2 border-b border-primary-tint bg-primary-subtle px-4 py-3">
              <span className="font-jua text-body-03 text-text-strong">FleaFlea</span>
              <span className="text-xs text-text-muted">{section} · 미리보기</span>
            </div>
            <div className="space-y-4 p-4 sm:p-6">{children}</div>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-body-04 text-text-muted">{caption}</figcaption>
    </figure>
  )
}

// 실제 화면 캡처를 보여주는 칸. 사진은 public/landing에 둔다.
// 캡처 원본 크기를 적어 두어 사진이 뜨기 전에도 자리가 잡혀 화면이 밀리지 않게 한다
export function FeaturePhoto({
  src,
  width,
  height,
  alt,
  caption,
}: {
  src: string
  width: number
  height: number
  alt: string
  caption: string
}) {
  return (
    <figure className="mx-auto w-full max-w-xl min-w-0">
      <img
        draggable={false}
        src={src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        // 캡처의 둥근 모서리(투명 영역)를 따라 그림자가 지도록 box-shadow 대신 필터를 쓴다
        className="block h-auto w-full rounded-2xl drop-shadow-lg"
      />
      <figcaption className="mt-4 text-center text-body-04 text-text-muted">{caption}</figcaption>
    </figure>
  )
}

// 예시 화면의 동작 표시는 탭 순서에 들어가지 않도록 버튼 대신 span으로 그린다.
function PreviewAction({ children, subtle = false }: { children: ReactNode; subtle?: boolean }) {
  return (
    <span
      style={{ clipPath: pixelBox(2) }}
      className={
        'inline-flex shrink-0 items-center justify-center gap-1 px-3 py-2 text-xs font-bold ' +
        (subtle ? 'bg-primary-subtle text-status-brand' : 'bg-primary text-white')
      }
    >
      {children}
    </span>
  )
}

function MiniAvatar({ src }: { src: string }) {
  return (
    <span
      style={{ clipPath: pixelBox(2) }}
      className="grid size-8 shrink-0 place-items-center bg-primary-subtle"
    >
      <img
        draggable={false}
        src={src}
        alt=""
        loading="lazy"
        width={32}
        height={32}
        className="size-8 object-contain [image-rendering:pixelated]"
      />
    </span>
  )
}

export function FriendsMockup() {
  return (
    <PreviewFrame section="친구" caption="친구가 되면 도감을 둘러보고, 콕 찔러 안부를 전해요.">
      <div className="flex items-center gap-2 rounded-full bg-primary-subtle px-4 py-3 text-body-04 text-text-muted">
        <MagnifyingGlassIcon className="size-4 shrink-0" aria-hidden="true" /> 닉네임으로 친구 찾기
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-text-muted">
          받은 친구 요청 <span className="text-status-brand">1</span>
        </p>
        <div
          style={{ clipPath: pixelBox(3) }}
          className="flex flex-wrap items-center gap-3 bg-primary-subtle p-3"
        >
          <MiniAvatar src={MASCOTS.beret} />
          <span className="flex-1 text-body-04 font-bold text-text-strong">지우</span>
          <PreviewAction>수락</PreviewAction>
          <span className="text-xs text-text-muted">거절</span>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-text-muted">
          내 친구 <span className="text-status-brand">2</span>
        </p>
        <div className="divide-y divide-primary-subtle">
          {[
            { nickname: '은지', src: MASCOTS.smile },
            { nickname: '하늘', src: MASCOTS.wink },
          ].map((friend) => (
            <div key={friend.nickname} className="flex flex-wrap items-center gap-2 py-3">
              <MiniAvatar src={friend.src} />
              <span className="min-w-0 flex-1 text-body-04 font-bold text-text-strong">
                {friend.nickname}
              </span>
              <div className="flex gap-1">
                <PreviewAction subtle>물건 도감</PreviewAction>
                <PreviewAction subtle>
                  <HandRaisedIcon className="size-3" aria-hidden="true" /> 콕
                </PreviewAction>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  )
}
