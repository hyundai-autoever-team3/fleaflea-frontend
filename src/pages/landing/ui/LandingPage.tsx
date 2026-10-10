import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HeartIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline'

import { useScrollReveal } from '../../../shared/lib/useScrollReveal'
import { useStaggerReveal } from '../../../shared/lib/useStaggerReveal'
import { FeaturePhoto, FriendsMockup } from './FeatureMockups'
import { LandingHeader } from './LandingHeader'

// 알약 배지용 가벼운 글래스 — 같은 톤이지만 pill 크기에 맞춰 블러/그림자를 줄임
const glassPill = 'glass-pill rounded-full'

// 로그인 후 실제 앱 화면을 미리 보여주는 브라우저 창 목업. 창 틀은 코드로 그리고 안쪽은 실제 화면 캡처(public/landing)를 넣는다.
function BrowserMockup() {
  return (
    <div className="mx-auto w-full max-w-2xl text-left">
      <div className="overflow-hidden rounded-3xl border border-primary-tint bg-bg shadow-lg">
        <div className="flex items-center gap-3 border-b border-primary-tint bg-primary-subtle px-4 py-2">
          <span aria-hidden="true" className="flex shrink-0 gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="size-2 rounded-full bg-primary-tint" />
            <span className="size-2 rounded-full bg-bg" />
          </span>
          <span className="mx-auto flex min-w-0 items-center gap-1 text-xs text-text-muted">
            <LockClosedIcon aria-hidden="true" className="size-3 shrink-0" />
            <span className="truncate">FleaFlea · 서비스 미리보기</span>
          </span>
        </div>
        {/* 캡처 원본 크기를 적어 두어 사진이 뜨기 전에도 자리가 잡혀 화면이 밀리지 않게 한다 */}
        <img
          draggable={false}
          src="/landing/intro.png"
          alt="FleaFlea 마켓 화면. 위쪽 배너 아래에 참여 중인 마켓 목록이 보인다."
          loading="lazy"
          width={1243}
          height={860}
          className="block h-auto w-full"
        />
      </div>
    </div>
  )
}

const FEATURE_SECTION_CLASS =
  'mx-auto flex min-h-dvh w-full max-w-6xl snap-start flex-col items-center justify-center gap-10 px-6 py-16 lg:gap-16'

const navItems = [
  { id: 'intro', label: '서비스 소개' },
  { id: 'how-to-use', label: '이용 방법' },
]

export function LandingPage() {
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

  return (
    <div className="h-dvh snap-y snap-proximity scroll-smooth overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <LandingHeader navItems={navItems} activeId={activeId} />

      {/* 히어로 — 점 그리드 텍스처 + 은은한 그라데이션 (design.md 6장 예외: 화면당 배경 1곳까지) */}
      <section
        id="top"
        className="relative flex min-h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-bg px-6 text-center"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px), radial-gradient(ellipse at 25% 15%, var(--color-primary-subtle) 0%, transparent 55%)',
            backgroundSize: '24px 24px, 100% 100%',
            // 아래쪽에서 무늬를 서서히 지워, 다음 화면으로 넘어가는 자리에 선이 남지 않게 한다
            WebkitMaskImage: 'linear-gradient(180deg, #000 45%, transparent 100%)',
            maskImage: 'linear-gradient(180deg, #000 45%, transparent 100%)',
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
            {/* 로그인 화면에서 가입과 소셜 로그인으로도 갈 수 있어 시작점을 하나로 둔다 */}
            <Link
              to="/login"
              viewTransition
              data-hover-lift
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-03 font-bold text-white"
            >
              시작하기
            </Link>
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
          style={{
            background:
              'linear-gradient(175deg, var(--color-bg) 0%, var(--color-blue-subtle) 55%, var(--color-primary-subtle) 100%)',
          }}
        />
        <div data-reveal-item className="relative">
          <h2 className="text-head-02 font-bold text-text-strong">
            당신의 두 번째 발견! 즐거운 플리마켓
          </h2>
          <p className="mt-2 text-body-03 text-text-muted">
            작은 취향을 나누고, 새로운 이야기를 시작해요 💜
          </p>
        </div>
        <div data-reveal-item className="relative min-w-0 max-w-full">
          <BrowserMockup />
        </div>
      </section>

      {/* 이용 방법 — 01. 나만의 플리마켓 만들기 */}
      <section
        id="how-to-use"
        ref={step01RevealRef}
        className={`${FEATURE_SECTION_CLASS} lg:flex-row`}
      >
        <div data-reveal-item className="w-full min-w-0 text-left lg:w-5/12 lg:shrink-0">
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

        <div data-reveal-item className="w-full min-w-0 flex-1">
          <FeaturePhoto
            src="/landing/intro2.png"
            width={596}
            height={522}
            alt="마켓 초대 링크 창. 초대 링크와 복사 버튼이 보인다."
            caption="초대 링크를 나누고, 로그인해서 함께 참여해요."
          />
        </div>
      </section>

      {/* 이용 방법 — 02. 판매/나눔/대여/교환 */}
      <section ref={step02RevealRef} className={`${FEATURE_SECTION_CLASS} lg:flex-row-reverse`}>
        <div data-reveal-item className="w-full min-w-0 text-left lg:w-5/12 lg:shrink-0">
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

        <div data-reveal-item className="w-full min-w-0 flex-1">
          <FeaturePhoto
            src="/landing/intro3.png"
            width={902}
            height={765}
            alt="마켓 상세 화면. 커버 사진 아래에 등록된 상품이 보인다."
            caption="마켓에서는 판매·나눔·대여, 도감에서는 서로 교환해요."
          />
        </div>
      </section>

      {/* 03. 내 물건 도감 */}
      <section ref={step03RevealRef} className={`${FEATURE_SECTION_CLASS} lg:flex-row`}>
        <div data-reveal-item className="w-full min-w-0 text-left lg:w-5/12 lg:shrink-0">
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

        <div data-reveal-item className="w-full min-w-0 flex-1">
          <FeaturePhoto
            src="/landing/intro4.png"
            width={919}
            height={787}
            alt="물건 도감 화면. 등록한 물건 사진이 칸마다 놓여 있다."
            caption="물건은 차곡차곡, 공개 여부는 내가 정해요."
          />
        </div>
      </section>

      {/* 04. 친구 추가 */}
      <section ref={step04RevealRef} className={`${FEATURE_SECTION_CLASS} lg:flex-row-reverse`}>
        <div data-reveal-item className="w-full min-w-0 text-left lg:w-5/12 lg:shrink-0">
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
            <br />콕 찔러 안부도 전할 수 있어요.
          </p>
        </div>

        <div data-reveal-item className="w-full min-w-0 flex-1">
          <FriendsMockup />
        </div>
      </section>

      {/* 05. 거래 진행 상태 */}
      <section ref={step05RevealRef} className={`${FEATURE_SECTION_CLASS} lg:flex-row`}>
        <div data-reveal-item className="w-full min-w-0 text-left lg:w-5/12 lg:shrink-0">
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

        <div data-reveal-item className="w-full min-w-0 flex-1">
          <FeaturePhoto
            src="/landing/intro5.png"
            width={1641}
            height={1217}
            alt="진행 중인 거래 화면. 요청, 수락, 완료 단계와 수락 알림이 보인다."
            caption="요청부터 완료까지, 거래 상태를 한눈에 확인해요."
          />
        </div>
      </section>

      {/* 푸터 — 스냅 대상 아님 (design.md: 랜딩 페이지 전용) */}
      <footer className="flex flex-col items-center justify-between gap-2 bg-primary-subtle px-6 py-6 text-body-04 text-text-muted md:flex-row">
        {/* 같은 말을 한국어와 영어로 두 번 하지 않는다. 이름도 FleaFlea 하나로 쓴다 */}
        <span className="flex items-baseline gap-2">
          <span className="font-jua text-body-03 font-bold text-primary">FleaFlea</span>
          <span>좋은 건 함께!</span>
        </span>
        <span>© 2026 FleaFlea</span>
      </footer>
    </div>
  )
}
