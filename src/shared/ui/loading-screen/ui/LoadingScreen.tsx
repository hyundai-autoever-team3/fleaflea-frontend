import { useEffect, useState } from 'react'

// 완료 시점을 모르는 요청은 표시 진행률을 90%로 제한한다.
const CEILING = 90
const TICK_MS = 180

interface LoadingScreenProps {
  message: string
  hint?: string
  // 전체 화면 대기와 목록 내부 대기를 같은 컴포넌트로 처리한다.
  fullScreen?: boolean
  // 고정 대기 시간이 있으면 해당 시간에 맞춰 100%까지 표시한다.
  holdMs?: number
  // 짧은 요청에서 로딩 화면이 깜박이지 않도록 표시를 지연한다.
  delayMs?: number
}

export function LoadingScreen({
  message,
  hint,
  fullScreen = true,
  holdMs,
  delayMs = holdMs ? 0 : 400,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(8)
  const [visible, setVisible] = useState(delayMs === 0)

  useEffect(() => {
    if (delayMs === 0) return

    const timer = setTimeout(() => setVisible(true), delayMs)

    return () => clearTimeout(timer)
  }, [delayMs])

  useEffect(() => {
    if (holdMs) {
      // 고정 시간 모드에서는 화면 갱신 주기에 맞춰 진행률을 계산한다.
      let frame = 0
      const startedAt = performance.now()
      const step = (now: number) => {
        const ratio = Math.min(1, (now - startedAt) / holdMs)
        setProgress(ratio * 100)
        if (ratio < 1) frame = requestAnimationFrame(step)
      }

      frame = requestAnimationFrame(step)

      return () => cancelAnimationFrame(frame)
    }

    const timer = setInterval(() => {
      // 초반에는 빠르게 증가하고 표시 상한에 가까워질수록 느려진다.
      setProgress((current) => current + Math.max(0.6, (CEILING - current) * 0.12))
    }, TICK_MS)

    return () => clearInterval(timer)
  }, [holdMs])

  if (!visible) return null

  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-dvh items-center justify-center bg-primary-subtle p-6'
          : 'flex justify-center py-16'
      }
    >
      <div className="glass-panel w-full max-w-sm rounded-2xl px-8 py-10 text-center">
        <img
          draggable={false}
          src="/mascot/flea10.png"
          alt=""
          className="mx-auto h-16 object-contain [image-rendering:pixelated]"
        />

        <p role="status" className="mt-5 text-body-03 font-bold text-glass-ink/92">
          {message}
        </p>
        {hint && <p className="mt-1 text-body-04 text-glass-ink/58">{hint}</p>}

        <div className="mt-7 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(Math.min(progress, holdMs ? 100 : CEILING))}
            aria-label={message}
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-primary-subtle"
          >
            <div
              // 프레임마다 갱신하는 고정 시간 모드에는 CSS 전환을 중복 적용하지 않는다.
              className={`h-full rounded-full bg-primary ${
                holdMs
                  ? ''
                  : 'transition-[width] duration-300 ease-out motion-reduce:transition-none'
              }`}
              style={{ width: `${holdMs ? progress : Math.min(progress, CEILING)}%` }}
            />
          </div>
          <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-glass-ink/58">
            {Math.round(holdMs ? Math.min(progress, 100) : Math.min(progress, CEILING))}%
          </span>
        </div>
      </div>
    </div>
  )
}
