import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { MASCOTS } from '../../../shared/config/mascots'
import { markOnboardingSeen } from '../../../shared/lib/onboarding'
import { pixelBox } from '../../../shared/lib/pixel'

// 설치한 앱을 처음 열었을 때 로그인 전에 한 번 보여주는 소개 화면.
// 브라우저에서는 랜딩 페이지가 이 역할을 하므로 여기서는 세 장으로 짧게 끝낸다.
const SLIDES = [
  {
    mascot: MASCOTS.smile,
    title: '초대받은 사람들끼리 여는 플리마켓',
    body: '학교, 회사, 동네 사람들과 마켓을 만들고 초대 링크를 보내 보세요.',
  },
  {
    mascot: MASCOTS.basket,
    title: '팔고, 나누고, 빌리고, 바꾸고',
    body: '마켓에 올린 물건은 팔거나 나누거나 빌려줄 수 있어요. 요청부터 완료까지 알림으로 알려드려요.',
  },
  {
    mascot: MASCOTS.star,
    title: '내 물건은 도감에 모아 두기',
    body: '가진 물건을 등록해 두면 친구가 도감을 둘러보다 먼저 빌려 달라고 하기도 해요.',
  },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  // 초대 링크로 들어왔다가 여기로 온 경우, 돌아갈 주소(?redirect=)를 로그인 화면까지 들고 간다
  const { search } = useLocation()
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const isLast = index === SLIDES.length - 1

  // 손으로 밀어 넘겼을 때도 점과 버튼 글자가 따라오도록, 스크롤 위치로 현재 장을 계산한다
  function handleScroll() {
    const track = trackRef.current
    if (!track) return

    setIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  function goTo(next: number) {
    const track = trackRef.current
    if (!track) return

    track.scrollTo({ left: next * track.clientWidth })
  }

  function finish() {
    // 끝까지 봤든 건너뛰었든 한 번 본 것으로 기록해 다음 실행부터는 바로 로그인으로 간다
    markOnboardingSeen()
    navigate(`/login${search}`, { replace: true, viewTransition: true })
  }

  return (
    <div className="flex h-dvh flex-col bg-primary-subtle">
      <div className="flex justify-end px-4 pt-4">
        <button type="button" onClick={finish} className="px-3 py-2 text-body-04 text-text-muted">
          건너뛰기
        </button>
      </div>

      {/* 가로로 한 장씩 넘기는 칸. scroll-snap이 손을 뗀 자리에서 가장 가까운 장에 맞춰 세운다 */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((slide, slideIndex) => (
          <section
            key={slide.title}
            aria-label={`${slideIndex + 1} / ${SLIDES.length}`}
            className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-8 text-center"
          >
            <img
              draggable={false}
              src={slide.mascot}
              alt=""
              className="h-40 object-contain [image-rendering:pixelated]"
            />
            <h1 className="mt-8 text-head-03 font-bold text-text-strong">{slide.title}</h1>
            <p className="mt-3 max-w-xs text-body-03 text-text-muted">{slide.body}</p>
          </section>
        ))}
      </div>

      <div className="mx-auto w-full max-w-sm px-6 pb-8">
        {/* 지금 몇 번째 장인지 보여주는 점. 누르면 그 장으로 간다 */}
        <div className="flex justify-center gap-2">
          {SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => goTo(slideIndex)}
              aria-label={`${slideIndex + 1}번째 소개 보기`}
              aria-current={slideIndex === index}
              className={`h-2 transition-all motion-reduce:transition-none ${
                slideIndex === index ? 'w-6 bg-primary' : 'w-2 bg-primary-tint'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isLast ? finish() : goTo(index + 1))}
          style={{ clipPath: pixelBox(4) }}
          className="mt-6 h-14 w-full bg-primary text-body-03 font-bold text-white transition-colors hover:bg-primary/90"
        >
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
