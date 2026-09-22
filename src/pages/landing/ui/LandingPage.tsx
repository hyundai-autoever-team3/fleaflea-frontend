import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent, PointerEvent } from 'react'
import { Link } from 'react-router'
import {
  CheckCircleIcon,
  HeartIcon,
  LockClosedIcon,
  SparklesIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import { withRedirect } from '../../../shared/lib/redirect'
import { isOutsideDialog } from '../../../shared/ui/modal'
import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useStaggerReveal } from '../../../shared/lib/useStaggerReveal'
import {
  CollectionMockup,
  FriendsMockup,
  InviteMockup,
  TradeFlowMockup,
  TradeWaysMockup,
} from './FeatureMockups'
import { LandingHeader } from './LandingHeader'

// Apple(macOS) 글래스모피즘 — 반투명 흰색 레이어 + 블러/채도 + 3겹 그림자(외곽선/남색 큰 그림자/상단 하이라이트).
// 값은 app/styles/glass.css의 유틸리티에 있다 — 알림 드롭다운도 같은 규칙을 쓴다
const glass = 'glass rounded-2xl'

// 알약 배지용 가벼운 글래스 — 같은 톤이지만 pill 크기에 맞춰 블러/그림자를 줄임
const glassPill = 'glass-pill rounded-full'


function Mascot({ className = 'size-10' }: { className?: string }) {
  return (
    <div className={`${className} shrink-0 overflow-hidden rounded-full`}>
      <img src="/mascot/flea.png" alt="" className="h-full w-full object-cover" />
    </div>
  )
}

// 로그인 후 실제 앱 화면을 미리 보여주는 브라우저 창 목업. 실제 캡처가 아니라 우리 컴포넌트/토큰으로 재구성한 것.
function BrowserMockup() {
  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg shadow-lg">
        <div className="flex items-center gap-2 border-b border-border bg-bg-subtle px-4 py-2">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="mx-auto flex items-center gap-1 text-body-04 text-text-muted">
            <LockClosedIcon className="size-3" /> FleaFlea · 우리들의 플리마켓
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <span className="font-jua text-body-03 text-text-strong">FleaFlea</span>
            <span className="rounded-full bg-bg-subtle px-3 py-1 text-body-04 text-text-muted">
              어떤 보물을 찾고 있나요?
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-primary-subtle p-4">
            <div>
              <p className="text-body-03 font-bold text-text-strong">우리들의 플리마켓</p>
              <p className="mt-1 text-body-04 text-text-muted">
                작은 취향을 나누고, 새로운 이야기를 시작해요.
              </p>
            </div>
            <Mascot className="size-16" />
          </div>
        </div>
      </div>

      {/* 글래스모피즘 알림 카드 2개 — 프레임 밖으로 살짝 걸치게 배치 */}
      <div className={`absolute -left-6 top-10 flex max-w-56 items-center gap-3 p-4 ${glass}`}>
        <UserGroupIcon className="size-6 shrink-0 text-primary" />
        <div className="text-left">
          <p className="text-body-04 font-bold text-glass-ink/92">은지님이 마켓에 참여했어요!</p>
          <p className="text-body-04 text-glass-ink/58">우리 마켓에 새로운 친구가 생겼어요.</p>
        </div>
      </div>
      <div className={`absolute -right-6 -bottom-6 flex items-center gap-3 p-4 ${glass}`}>
        <CheckCircleIcon className="size-6 shrink-0 text-primary" />
        <div className="text-left">
          <p className="text-body-04 font-bold text-glass-ink/92">기분 좋은 거래 완료</p>
          <p className="text-body-04 text-glass-ink/58">물건에 새로운 이야기가 생겼어요.</p>
        </div>
      </div>
    </div>
  )
}

const navItems = [
  { id: 'intro', label: '서비스 소개' },
  { id: 'how-to-use', label: '이용 방법' },
]

export function LandingPage() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  // 입력칸에서 글자를 끌다 바깥에서 손을 떼도 닫히지 않도록, 누른 자리도 바깥이었는지 기억한다
  const pressedOutsideRef = useRef(false)
  const [invite, setInvite] = useState('')
  const [inviteError, setInviteError] = useState('')
  // 코드를 확인하면 모달 안에서 다음 단계로 넘어간다. 여기서 화면을 옮겨 버리면
  // 모달로 시작한 흐름이 갑자기 페이지로 바뀌어 끊긴 느낌이 난다
  const [invitedCode, setInvitedCode] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const heroRevealRef = useScrollReveal<HTMLDivElement>()
  const introRevealRef = useStaggerReveal<HTMLElement>()
  const step01RevealRef = useStaggerReveal<HTMLElement>()
  const step02RevealRef = useStaggerReveal<HTMLElement>()
  const step03RevealRef = useStaggerReveal<HTMLElement>()
  const step04RevealRef = useStaggerReveal<HTMLElement>()
  const step05RevealRef = useStaggerReveal<HTMLElement>()

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  function joinMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = invite.trim()
    let code = value
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      try {
        const url = new URL(value, window.location.origin)
        const match = url.pathname.match(/^\/invite\/([a-zA-Z0-9_-]+)\/?$/)
        if (url.origin !== window.location.origin || !match) throw new Error('Invalid invitation')
        code = match[1]
      } catch {
        setInviteError('이 서비스의 초대 링크나 초대 코드를 입력해 주세요.')
        return
      }
    }
    if (!code || code.length > 128) {
      setInviteError('올바른 초대 코드를 입력해 주세요.')
      return
    }
    setInvitedCode(encodeURIComponent(code))
  }

  return (
    <div className="h-dvh snap-y snap-proximity scroll-smooth overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <LandingHeader navItems={navItems} activeId={activeId} />

      {/* 히어로 — 점 그리드 텍스처 + 은은한 그라데이션 (design.md 6장 예외: 화면당 배경 1곳까지) */}
      <section id="top" className="relative flex min-h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px), radial-gradient(ellipse at 25% 15%, var(--color-primary-subtle) 0%, transparent 55%)',
            backgroundSize: '24px 24px, 100% 100%',
          }}
        />
        <div ref={heroRevealRef} data-reveal className="relative flex flex-col items-center gap-4">
          <span className="flex items-center gap-2 text-body-04 font-bold tracking-widest text-primary">
            <SparklesIcon className="size-4" /> FRIENDS FLEA MARKET
          </span>
          <h1 className="text-head-00 font-bold text-text-strong">
            우리 동네 플리마켓,
            <br />
            <span className="text-primary">지금 시작하세요</span>
          </h1>
          <p className="text-body-03 text-text-muted">
            링크 하나로 초대하고, 판매·나눔·대여·교환까지 —
            <br />
            필요한 물건을 주고받는 가장 쉬운 방법
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              data-hover-lift
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-03 font-bold text-white">
              초대 링크로 참여하기
            </button>
          </div>
        </div>
      </section>

      {/* 서비스 소개 — 은은한 그라데이션 배경 위에 목업 카드가 뜨는 구성 */}
      <section
        id="intro"
        ref={introRevealRef}
        className="relative flex min-h-dvh snap-start flex-col items-center justify-center gap-10 overflow-hidden px-6 py-16 text-center"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, var(--color-blue-subtle), var(--color-primary-subtle))' }}
        />
        <div data-reveal-item className="relative">
          <h2 className="text-head-02 font-bold text-text-strong">당신의 두 번째 발견! 즐거운 플리마켓</h2>
          <p className="mt-2 text-body-03 text-text-muted">작은 취향을 나누고, 새로운 이야기를 시작해요 💜</p>
        </div>
        <div data-reveal-item className="relative">
          <BrowserMockup />
        </div>
      </section>

      {/* 이용 방법 — 01. 나만의 플리마켓 만들기 */}
      <section
        id="how-to-use"
        ref={step01RevealRef}
        className="mx-auto flex min-h-dvh w-full max-w-5xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:gap-16"
      >
        <div data-reveal-item className="text-left">
          <span
            data-hover-lift
            className={`inline-flex items-center gap-2 px-3 py-1 text-body-04 font-bold tracking-widest text-text-muted ${glassPill}`}
          >
            01 OUR LITTLE MARKET
          </span>
          <h2 className="mt-6 text-head-02 font-bold text-text-strong">
            나만의 플리마켓을
            <br />
            <span className="text-primary">열어보세요</span>
          </h2>
          <p className="mt-4 text-body-03 text-text-muted">
            학교, 회사, 동네 커뮤니티 등 원하는 사람들과
            <br />
            함께 플리마켓을 만들어보세요.
            <br />
            초대 링크만 공유하면 누구나 쉽게 참여할 수 있어요.
          </p>
        </div>

        <div data-reveal-item className="w-full flex-1">
          <InviteMockup />
        </div>
      </section>

      {/* 이용 방법 — 02. 판매/나눔/대여/교환 */}
      <section
        ref={step02RevealRef}
        className="mx-auto flex min-h-dvh w-full max-w-5xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row-reverse md:gap-16"
      >
        <div data-reveal-item className="text-left">
          <span
            data-hover-lift
            className={`inline-flex items-center gap-2 px-3 py-1 text-body-04 font-bold tracking-widest text-text-muted ${glassPill}`}
          >
            02 FOUR WAYS TO SHARE
          </span>
          <h2 className="mt-6 text-head-02 font-bold text-text-strong">
            팔고, 나누고,
            <br />
            <span className="text-primary">빌리고, 바꾸고</span>
          </h2>
          <p className="mt-4 text-body-03 text-text-muted">
            마켓에 올린 물건은 팔거나 나누거나 빌려주고,
            <br />
            도감 속 물건은 빌려주거나 서로 바꿔요.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-body-04 text-text-muted">
            <HeartIcon className="size-4" /> 정말 갖고 싶을 땐 구걸도 할 수 있어요
          </span>
        </div>

        <div data-reveal-item className="w-full flex-1">
          <TradeWaysMockup />
        </div>
      </section>

      {/* 03. 내 물건 도감 */}
      <section
        ref={step03RevealRef}
        className="mx-auto flex min-h-dvh w-full max-w-5xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:gap-16"
      >
        <div data-reveal-item className="text-left">
          <span
            data-hover-lift
            className={`inline-flex items-center gap-2 px-3 py-1 text-body-04 font-bold tracking-widest text-text-muted ${glassPill}`}
          >
            03 YOUR PERSONAL COLLECTION
          </span>
          <h2 className="mt-6 text-head-02 font-bold text-text-strong">
            내 물건을 도감처럼
            <br />
            <span className="text-primary">정리하세요</span>
          </h2>
          <p className="mt-4 text-body-03 text-text-muted">
            가지고 있는 물건을 등록하고
            <br />
            공개/비공개로 관리해보세요.
            <br />
            친구들이 내 물건을 보고 먼저 요청할 수도 있어요.
          </p>
        </div>

        {/* 오른쪽 그래픽은 별도로 채워 넣을 예정 — 자리만 확보 */}
        <div data-reveal-item className="w-full flex-1">
          <CollectionMockup />
        </div>
      </section>

      {/* 04. 친구 추가 */}
      <section
        ref={step04RevealRef}
        className="mx-auto flex min-h-dvh w-full max-w-5xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row-reverse md:gap-16"
      >
        <div data-reveal-item className="text-left">
          <span
            data-hover-lift
            className={`inline-flex items-center gap-2 px-3 py-1 text-body-04 font-bold tracking-widest text-text-muted ${glassPill}`}
          >
            04 BETTER WITH FRIENDS
          </span>
          <h2 className="mt-6 text-head-02 font-bold text-text-strong">
            친구를 추가하고
            <br />
            <span className="text-primary">더 편하게 거래하세요</span>
          </h2>
          <p className="mt-4 text-body-03 text-text-muted">
            닉네임으로 친구를 찾아 요청을 보내고,
            <br />
            상대가 수락하면 친구가 돼요.
            <br />
            친구끼리는 서로의 도감을 둘러보고
            <br />
            콕 찔러 안부도 전할 수 있어요.
          </p>
        </div>

        {/* 왼쪽 그래픽은 별도로 채워 넣을 예정 — 자리만 확보 */}
        <div data-reveal-item className="w-full flex-1">
          <FriendsMockup />
        </div>
      </section>

      {/* 05. 거래 진행 상태 */}
      <section
        ref={step05RevealRef}
        className="mx-auto flex min-h-dvh w-full max-w-5xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 md:flex-row md:gap-16"
      >
        <div data-reveal-item className="text-left">
          <span
            data-hover-lift
            className={`inline-flex items-center gap-2 px-3 py-1 text-body-04 font-bold tracking-widest text-text-muted ${glassPill}`}
          >
            05 EVERY STEP, NICE AND CLEAR
          </span>
          <h2 className="mt-6 text-head-02 font-bold text-text-strong">
            요청, 수락, 완료까지
            <br />
            <span className="text-primary">깔끔하게</span>
          </h2>
          <p className="mt-4 text-body-03 text-text-muted">
            거래 요청을 보내고 수락·거절하며,
            <br />
            진행 상태를 실시간으로 관리하세요.
          </p>
        </div>

        {/* 오른쪽 그래픽은 별도로 채워 넣을 예정 — 자리만 확보 */}
        <div data-reveal-item className="w-full flex-1">
          <TradeFlowMockup />
        </div>
      </section>

      {/* 푸터 — 스냅 대상 아님 (design.md: 랜딩 페이지 전용) */}
      <footer className="flex flex-col items-center justify-between gap-2 bg-primary-subtle px-6 py-6 text-body-04 text-text-muted md:flex-row">
        {/* 같은 말을 한국어와 영어로 두 번 하지 않는다. 이름도 FleaFlea 하나로 쓴다 */}
        <span className="flex items-center gap-2">
          <span className="font-jua text-body-03 font-bold text-primary">FleaFlea</span>
          <span>좋은 건 함께!</span>
        </span>
        <span>© 2026 FleaFlea</span>
      </footer>

      <dialog
        ref={dialogRef}
        className={`m-auto w-[min(440px,calc(100vw-36px))] p-8 text-center rounded-2xl shadow-lg`}
        // <dialog>는 바깥을 눌러도 저절로 닫히지 않는다. 공용 모달과 같은 판정을 쓴다
        onPointerDown={(event: PointerEvent<HTMLDialogElement>) => {
          pressedOutsideRef.current = event.target === event.currentTarget && isOutsideDialog(event)
        }}
        onClick={(event: MouseEvent<HTMLDialogElement>) => {
          const pressedOutside = pressedOutsideRef.current
          pressedOutsideRef.current = false
          if (pressedOutside && event.target === event.currentTarget && isOutsideDialog(event)) {
            dialogRef.current?.close()
          }
        }}
        onClose={() => {
          setInvite('')
          setInviteError('')
          setInvitedCode('')
        }}
      >
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="닫기"
          className="absolute right-4 top-4"
        >
          <XMarkIcon className="size-6" />
        </button>

        {invitedCode ? (
          <>
            <h2 className="text-center text-gray-800 text-head-03 font-bold">초대받은 마켓이에요</h2>
            <p className="mt-2 text-center text-body-03 text-text-muted">
              로그인하면 이 마켓으로 바로 들어가요.
            </p>

            <img src="/mascot/flea10.png" alt="" className="mx-auto my-6 w-32 [image-rendering:pixelated]" />

            <Link
              to={withRedirect('/login', `/invite/${invitedCode}?join=1`)}
              viewTransition
              onClick={() => dialogRef.current?.close()}
              data-hover-lift
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-body-03 font-bold text-white"
            >
              로그인하고 참여하기
            </Link>

            <p className="mt-6 text-center text-body-04 text-text-muted">
              아직 계정이 없으신가요?{' '}
              <Link
                to={withRedirect('/signup', `/invite/${invitedCode}?join=1`)}
                viewTransition
                onClick={() => dialogRef.current?.close()}
                className="font-bold text-primary"
              >
                회원가입
              </Link>
            </p>

            <button
              type="button"
              onClick={() => setInvitedCode('')}
              className="mt-4 text-body-04 text-text-muted underline underline-offset-2"
            >
              다른 링크 넣기
            </button>
          </>
        ) : (
          <>
          <h2 className="text-center text-gray-800 text-head-03 font-bold">
            이웃의 초대를 받으셨나요?
          </h2>
          <p className="mt-2 text-gray-800 text-center text-body-03">
            받은 초대 링크나 코드를 붙여 넣어 주세요.
          </p>

          <img src="/mascot/flea.png" alt="" className="mx-auto my-6 w-32" />

          <form onSubmit={joinMarket} noValidate className="text-left">
            <label htmlFor="flea-invite-input" className="text-gray-800 text-body-04 font-bold ">
              초대 링크 또는 코드
            </label>
            <input
              id="flea-invite-input"
              name="invite"
              value={invite}
              onChange={(event) => {
                setInvite(event.target.value)
                setInviteError('')
              }}
              placeholder="초대 링크 또는 코드 붙여넣기"
              required
              maxLength={2048}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(inviteError)}
              className="mt-2 h-12 w-full rounded-lg border border-purple-100 bg-white/60 px-3 text-body-03 outline-none transition-colors focus:border-primary-tint focus:bg-white focus:ring-2 focus:ring-primary-tint"
            />
            {inviteError && <p className="mt-2 text-body-04 text-red-600">{inviteError}</p>}
            <button
              type="submit"
              data-hover-lift
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-body-03 font-bold text-white"
            >
              마켓 참여하기
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <hr className="flex-1 border-border" />
            <span className="text-body-04 text-text-muted">또는</span>
            <hr className="flex-1 border-border" />
          </div>

          <p className="mt-6 text-center text-body-04 text-text-muted">
            아직 계정이 없으신가요?{' '}
            <Link
              to="/signup"
              viewTransition
              onClick={() => dialogRef.current?.close()}
              className="font-bold text-primary"
            >
              회원가입
            </Link>
          </p>
          </>
        )}
      </dialog>
    </div>
  )
}
