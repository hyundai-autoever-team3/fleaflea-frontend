import { HandRaisedIcon, LinkIcon, LockClosedIcon } from '@heroicons/react/24/outline'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'

// 이용 방법 다섯 칸의 그림. 실제 화면을 캡처하지 않고 앱이 쓰는 토큰·픽셀 모서리로 다시 그렸다.
// 캡처는 화면이 바뀔 때마다 낡지만, 이렇게 두면 색과 모서리가 본문과 함께 따라간다
const PANEL = 'min-h-64 w-full flex-1 rounded-3xl bg-primary-subtle p-6 md:min-h-96 flex flex-col justify-center gap-3'
const CARD = 'bg-bg p-3'

// 01 — 초대 링크 하나로 사람을 불러 모으는 모습
export function InviteMockup() {
  return (
    <div className={PANEL}>
      <div style={{ clipPath: pixelBox(4) }} className={`${CARD} flex items-center gap-2`}>
        <LinkIcon aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-body-04 text-text-muted">fleaflea.app/invite/a1b2c3</span>
        <span
          style={{ clipPath: pixelBox(2) }}
          className="shrink-0 bg-primary px-2 py-1 text-[11px] font-bold text-white"
        >
          복사
        </span>
      </div>
      <p className="text-center text-body-04 text-text-muted">링크를 받은 사람은 바로 들어와요</p>
      <div className="flex justify-center -space-x-2">
        {[MASCOTS.smile, MASCOTS.wink, MASCOTS.star, MASCOTS.beret].map((mascot) => (
          <span
            key={mascot}
            style={{ clipPath: pixelBox(2) }}
            className="size-10 overflow-hidden bg-bg ring-2 ring-primary-subtle"
          >
            <img src={mascot} alt="" className="size-full object-contain [image-rendering:pixelated]" />
          </span>
        ))}
      </div>
    </div>
  )
}

// 02 — 같은 물건도 상황에 따라 다른 방식으로 오간다
const WAYS = [
  { label: '판매', detail: '25,000원' },
  { label: '나눔', detail: '무료 나눔' },
  { label: '대여', detail: '3일 빌려요' },
  { label: '교환', detail: '내 물건과' },
]

export function TradeWaysMockup() {
  return (
    <div className={PANEL}>
      <div className="grid grid-cols-2 gap-3">
        {WAYS.map(({ label, detail }) => (
          <div key={label} style={{ clipPath: pixelBox(4) }} className={CARD}>
            <span
              style={{ clipPath: pixelBox(2) }}
              className="inline-block bg-primary-subtle px-2 py-0.5 text-[11px] font-bold text-primary"
            >
              {label}
            </span>
            <p className="mt-1.5 text-body-04 font-bold text-text-strong">{detail}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-body-04 text-text-muted">구걸은 사연을 적어 보내요</p>
    </div>
  )
}

// 03 — 인벤토리 판처럼 칸에 담기는 내 물건들
export function CollectionMockup() {
  const slots = [MASCOTS.basket, MASCOTS.star, MASCOTS.smile, MASCOTS.beret, MASCOTS.wink, null]
  return (
    <div className={PANEL}>
      <div style={{ clipPath: pixelBox(6) }} className="bg-primary-tint p-2">
        <div style={{ clipPath: pixelBox(6) }} className="grid grid-cols-3 gap-2 bg-bg p-3">
          {slots.map((mascot, index) => (
            <span
              key={index}
              style={{ clipPath: pixelBox(3) }}
              className="relative grid aspect-square place-items-center bg-primary-subtle"
            >
              {mascot && (
                <img src={mascot} alt="" className="h-2/3 object-contain [image-rendering:pixelated]" />
              )}
              {index === 1 && (
                <span
                  style={{ clipPath: pixelBox(2) }}
                  className="absolute right-1 top-1 grid size-5 place-items-center bg-black/55 text-white"
                >
                  <LockClosedIcon aria-hidden className="size-3" />
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
      <p className="text-center text-body-04 text-text-muted">비공개로 두면 나만 봐요</p>
    </div>
  )
}

// 04 — 친구가 되면 열리는 것들
export function FriendsMockup() {
  return (
    <div className={PANEL}>
      {[
        { name: '은지', caption: '친구' },
        { name: '종필', caption: '요청을 보냈어요' },
      ].map(({ name, caption }, index) => (
        <div key={name} style={{ clipPath: pixelBox(4) }} className={`${CARD} flex items-center gap-3`}>
          <span style={{ clipPath: pixelBox(2) }} className="size-10 shrink-0 overflow-hidden bg-primary-subtle">
            <img
              src={index === 0 ? MASCOTS.smile : MASCOTS.beret}
              alt=""
              className="size-full object-contain [image-rendering:pixelated]"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-body-04 font-bold text-text-strong">{name}</span>
            <span className="block text-[11px] text-text-muted">{caption}</span>
          </span>
          {index === 0 && (
            <span
              style={{ clipPath: pixelBox(2) }}
              className="flex shrink-0 items-center gap-1 bg-primary-subtle px-2 py-1 text-[11px] font-bold text-primary"
            >
              <HandRaisedIcon aria-hidden className="size-3" />
              콕
            </span>
          )}
        </div>
      ))}
      <p className="text-center text-body-04 text-text-muted">친구끼리는 서로의 도감이 열려요</p>
    </div>
  )
}

// 05 — 요청부터 완료까지 한 줄로 이어지는 흐름
const STEPS = [
  { label: '요청을 보냈어요', tone: 'bg-primary-subtle text-text-muted' },
  { label: '수락했어요', tone: 'bg-primary-tint text-text-strong' },
  { label: '대여 중', tone: 'bg-primary-tint text-text-strong' },
  { label: '대여 완료', tone: 'bg-primary text-white' },
]

export function TradeFlowMockup() {
  return (
    <div className={PANEL}>
      <ol className="flex flex-col gap-2">
        {STEPS.map(({ label, tone }, index) => (
          <li key={label} className="flex items-center gap-3">
            {/* 점과 선으로 단계가 이어진다는 것만 보여준다 */}
            <span className="flex w-3 shrink-0 flex-col items-center">
              <span className={`size-3 ${index === STEPS.length - 1 ? 'bg-primary' : 'bg-primary-tint'}`} />
            </span>
            <span
              style={{ clipPath: pixelBox(2) }}
              className={`flex-1 px-3 py-2 text-body-04 font-bold ${tone}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-center text-body-04 text-text-muted">바뀔 때마다 알림으로 알려줘요</p>
    </div>
  )
}
