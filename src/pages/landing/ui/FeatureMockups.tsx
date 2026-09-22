import type { ReactNode } from 'react'
import {
  ArrowPathIcon,
  BellIcon,
  CheckIcon,
  HandRaisedIcon,
  LinkIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

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
        <div style={{ clipPath: pixelBox(6) }} className="bg-primary-tint p-[2px]">
          <div style={{ clipPath: pixelBox(6) }} className="bg-bg">
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

// 예시 화면의 동작 표시는 탭 순서에 들어가지 않도록 버튼 대신 span으로 그린다.
function PreviewAction({ children, subtle = false }: { children: ReactNode; subtle?: boolean }) {
  return (
    <span
      style={{ clipPath: pixelBox(2) }}
      className={'inline-flex shrink-0 items-center justify-center gap-1 px-3 py-2 text-xs font-bold ' +
        (subtle ? 'bg-primary-subtle text-status-brand' : 'bg-primary text-white')}
    >
      {children}
    </span>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{ clipPath: pixelBox(2) }}
      className="inline-flex bg-primary-subtle px-2 py-1 text-[11px] font-bold text-status-brand"
    >
      {children}
    </span>
  )
}

function MiniAvatar({ src }: { src: string }) {
  return (
    <span style={{ clipPath: pixelBox(2) }} className="grid size-8 shrink-0 place-items-center bg-primary-subtle">
      <img src={src} alt="" loading="lazy" width={32} height={32} className="size-8 object-contain [image-rendering:pixelated]" />
    </span>
  )
}

type ItemKind = 'camera' | 'book' | 'cup' | 'game'

// 16 × 16 오브젝트를 정수 배율로 그려 기존 픽셀 윤곽과 맞춘다.
function ItemArt({ kind, small = false }: { kind: ItemKind; small?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={small ? 32 : 64}
      height={small ? 32 : 64}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={small ? 'size-8 shrink-0' : 'size-12 shrink-0 sm:size-16'}
    >
      <g fill="var(--navy-900)">
        {kind === 'camera' && (
          <>
            <path d="M4 2h6v2h5v10H1V4h3z" />
            <path fill="var(--color-primary)" d="M2 5h12v8H2zM5 3h4v1H5z" />
            <path d="M6 6h4v1h1v4h-1v1H6v-1H5V7h1z" />
            <path fill="var(--color-bg)" d="M7 7h2v1h1v2H9v1H7v-1H6V8h1zM12 6h1v1h-1z" />
            <path fill="var(--color-primary-tint)" d="M7 8h2v2H7z" />
          </>
        )}
        {kind === 'book' && (
          <>
            <path d="M3 1h10v14H3v-1H2V2h1z" />
            <path fill="var(--color-primary)" d="M4 2h8v10H4z" />
            <path fill="var(--color-primary-tint)" d="M3 2h1v10H3z" />
            <path fill="var(--color-bg)" d="M3 13h9v1H3zM6 4h4v1H6zM6 7h3v1H6z" />
          </>
        )}
        {kind === 'cup' && (
          <>
            <path d="M2 4h10v1h3v6h-4v2h-1v1H4v-1H3V6H2z" />
            <path fill="var(--color-primary)" d="M4 6h6v6H9v1H5v-1H4z" />
            <path fill="var(--color-bg)" d="M5 6h1v5H5zM12 6h2v4h-2z" />
            <path fill="var(--color-primary-tint)" d="M3 5h8v1H3zM5 1h1v2H5zM8 1h1v2H8z" />
          </>
        )}
        {kind === 'game' && (
          <>
            <path d="M4 1h8v13h-1v1H4z" />
            <path fill="var(--color-primary)" d="M5 2h6v11h-1v1H5z" />
            <path d="M5 3h6v5H5zM6 9h1v1h1v1H7v1H6v-1H5v-1h1zM9 10h1v1H9z" />
            <path fill="var(--color-primary-subtle)" d="M6 4h4v3H6z" />
            <path fill="var(--color-primary-tint)" d="M7 5h2v1H7z" />
          </>
        )}
      </g>
    </svg>
  )
}

export function InviteMockup() {
  return (
    <PreviewFrame section="우리 마켓" caption="초대 링크를 나누고, 로그인해서 함께 참여해요.">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge>HOST</Badge>
          <p className="mt-2 text-body-03 font-bold text-text-strong">우리들의 작은 플리마켓</p>
          <p className="mt-1 text-xs text-text-muted">좋아하던 물건에 새로운 주인을 찾아요.</p>
        </div>
        <img src={MASCOTS.smile} alt="" loading="lazy" width={64} height={64} className="size-16 shrink-0 object-contain [image-rendering:pixelated]" />
      </div>
      <div style={{ clipPath: pixelBox(4) }} className="space-y-3 bg-primary-subtle p-4">
        <p className="flex items-center gap-2 text-body-04 font-bold text-text-strong">
          <LinkIcon className="size-4 text-status-brand" aria-hidden="true" /> 마켓 초대 링크
        </p>
        <div className="flex items-center gap-2 bg-bg p-2">
          <span className="min-w-0 flex-1 truncate text-xs text-text-muted">fleaflea.app/invite/OURMARKET</span>
          <PreviewAction>복사</PreviewAction>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-primary-subtle pt-4">
        <span className="text-body-04 font-bold text-text-strong">함께하는 이웃 <span className="text-status-brand">3</span></span>
        <div className="flex gap-2">
          {[MASCOTS.smile, MASCOTS.wink, MASCOTS.beret].map((src) => <MiniAvatar key={src} src={src} />)}
        </div>
      </div>
    </PreviewFrame>
  )
}

const PRODUCTS = [
  { kind: 'camera', title: '작은 디지털카메라', type: '판매', price: '25,000원' },
  { kind: 'book', title: '좋아하는 책 한 권', type: '나눔', price: '무료 나눔' },
  { kind: 'game', title: '주말의 게임 친구', type: '대여', price: '대여 문의' },
] as const

export function TradeWaysMockup() {
  return (
    <PreviewFrame section="물건 둘러보기" caption="마켓에서는 판매·나눔·대여, 도감에서는 서로 교환해요.">
      <p className="text-body-03 font-bold text-text-strong">마켓에서 발견한 물건</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PRODUCTS.map((product) => (
          <div key={product.kind} style={{ clipPath: pixelBox(3) }} className="bg-primary-tint p-[2px]">
            <div style={{ clipPath: pixelBox(3) }} className="flex h-full items-center gap-3 bg-bg p-2 sm:block">
              <div style={{ clipPath: pixelBox(2) }} className="grid size-20 shrink-0 place-items-center bg-primary-subtle sm:aspect-square sm:h-auto sm:w-full">
                <ItemArt kind={product.kind} />
              </div>
              <div className="min-w-0 sm:mt-2">
                <Badge>{product.type}</Badge>
                <p className="mt-1 truncate text-xs font-bold text-text-strong">{product.title}</p>
                <p className="mt-1 text-xs text-text-muted">{product.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ clipPath: pixelBox(4) }} className="flex flex-wrap items-center gap-3 bg-primary-subtle p-3">
        <ArrowPathIcon className="size-5 shrink-0 text-status-brand" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-text-strong">친구의 도감에서는 교환도</p>
          <p className="mt-1 text-xs text-text-muted">내 카메라와 친구의 게임기</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <ItemArt kind="camera" small />
          <ItemArt kind="game" small />
        </div>
      </div>
    </PreviewFrame>
  )
}

const COLLECTION = [
  { kind: 'camera', title: '나의 카메라', isPublic: true },
  { kind: 'book', title: '소중한 책', isPublic: false },
  { kind: 'cup', title: '보라 머그', isPublic: true },
  { kind: 'game', title: '게임기', isPublic: true },
  { kind: 'book', title: '여행 기록', isPublic: true },
] as const

export function CollectionMockup() {
  return (
    <PreviewFrame section="물건 도감" caption="물건은 차곡차곡, 공개 여부는 내가 정해요.">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-03 font-bold text-text-strong">내 물건 도감 <span className="text-status-brand">5</span></p>
        <PreviewAction><PlusIcon className="size-3" aria-hidden="true" /> 물건 등록</PreviewAction>
      </div>
      <div style={{ clipPath: pixelBox(4) }} className="bg-primary-tint p-2">
        <div style={{ clipPath: pixelBox(3) }} className="grid grid-cols-3 gap-2 bg-bg p-2">
          {COLLECTION.map((item) => (
            <div key={item.title} className="min-w-0">
              <div style={{ clipPath: pixelBox(2) }} className="relative grid aspect-square place-items-center bg-primary-subtle">
                <ItemArt kind={item.kind} />
                {!item.isPublic && (
                  <span aria-label="비공개" className="absolute right-1 top-1 bg-text-strong/70 p-1 text-white" style={{ clipPath: pixelBox(1) }}>
                    <LockClosedIcon className="size-3" aria-hidden="true" />
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-center text-[11px] text-text-muted">{item.title}</p>
            </div>
          ))}
          <div className="min-w-0">
            <div style={{ clipPath: pixelBox(2) }} className="grid aspect-square place-items-center bg-primary-subtle text-status-brand">
              <PlusIcon className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-1 text-center text-[11px] text-text-muted">새 물건</p>
          </div>
        </div>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <LockClosedIcon className="size-3.5 shrink-0" aria-hidden="true" /> 자물쇠가 있는 물건은 나만 볼 수 있어요.
      </p>
    </PreviewFrame>
  )
}

export function FriendsMockup() {
  return (
    <PreviewFrame section="친구" caption="친구가 되면 도감을 둘러보고, 콕 찔러 안부를 전해요.">
      <div className="flex items-center gap-2 rounded-full bg-primary-subtle px-4 py-3 text-body-04 text-text-muted">
        <MagnifyingGlassIcon className="size-4 shrink-0" aria-hidden="true" /> 닉네임으로 친구 찾기
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-text-muted">받은 친구 요청 <span className="text-status-brand">1</span></p>
        <div style={{ clipPath: pixelBox(3) }} className="flex flex-wrap items-center gap-3 bg-primary-subtle p-3">
          <MiniAvatar src={MASCOTS.beret} />
          <span className="flex-1 text-body-04 font-bold text-text-strong">지우</span>
          <PreviewAction>수락</PreviewAction>
          <span className="text-xs text-text-muted">거절</span>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold text-text-muted">내 친구 <span className="text-status-brand">2</span></p>
        <div className="divide-y divide-primary-subtle">
          {[
            { nickname: '은지', src: MASCOTS.smile },
            { nickname: '하늘', src: MASCOTS.wink },
          ].map((friend) => (
            <div key={friend.nickname} className="flex flex-wrap items-center gap-2 py-3">
              <MiniAvatar src={friend.src} />
              <span className="min-w-0 flex-1 text-body-04 font-bold text-text-strong">{friend.nickname}</span>
              <div className="flex gap-1">
                <PreviewAction subtle>물건 도감</PreviewAction>
                <PreviewAction subtle><HandRaisedIcon className="size-3" aria-hidden="true" /> 콕</PreviewAction>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  )
}

const TRADE_STEPS = ['요청', '수락', '완료']

export function TradeFlowMockup() {
  return (
    <PreviewFrame section="내 거래" caption="요청부터 완료까지, 거래 상태를 한눈에 확인해요.">
      <div className="flex flex-wrap gap-4 border-b border-primary-subtle text-xs font-bold">
        <span className="pb-2 text-text-muted">보낸 요청</span>
        <span className="border-b-2 border-primary pb-2 text-status-brand">진행 중</span>
        <span className="pb-2 text-text-muted">지난 거래</span>
      </div>
      <div className="flex items-center gap-4">
        <div style={{ clipPath: pixelBox(3) }} className="grid size-24 shrink-0 place-items-center bg-primary-subtle">
          <ItemArt kind="camera" />
        </div>
        <div className="min-w-0">
          <Badge>도감 · 대여</Badge>
          <p className="mt-2 text-body-04 font-bold text-text-strong">작은 디지털카메라</p>
          <p className="mt-1 text-xs text-text-muted">은지님과 거래 중이에요</p>
        </div>
      </div>
      <ol className="grid grid-cols-3 py-2">
        {TRADE_STEPS.map((step, index) => (
          <li key={step} aria-current={index === 1 ? 'step' : undefined} className="relative flex flex-col items-center gap-2">
            {index < TRADE_STEPS.length - 1 && (
              <span aria-hidden="true" className={'absolute left-1/2 top-4 h-0.5 w-full ' + (index === 0 ? 'bg-primary' : 'bg-primary-tint')} />
            )}
            <span style={{ clipPath: pixelBox(2) }} className={'relative grid size-8 place-items-center text-xs font-bold ' + (index < 2 ? 'bg-primary text-white' : 'bg-primary-subtle text-text-muted')}>
              {index === 0 ? <CheckIcon className="size-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={'text-xs ' + (index === 1 ? 'font-bold text-status-brand' : 'text-text-muted')}>{step}</span>
          </li>
        ))}
      </ol>
      <div style={{ clipPath: pixelBox(3) }} className="flex items-start gap-3 bg-primary-subtle p-3">
        <BellIcon className="mt-0.5 size-4 shrink-0 text-status-brand" aria-hidden="true" />
        <div>
          <p className="text-xs font-bold text-text-strong">은지님이 대여 요청을 수락했어요</p>
          <p className="mt-1 text-xs text-text-muted">진행 중인 거래는 마이페이지에서 확인해요.</p>
        </div>
      </div>
    </PreviewFrame>
  )
}
