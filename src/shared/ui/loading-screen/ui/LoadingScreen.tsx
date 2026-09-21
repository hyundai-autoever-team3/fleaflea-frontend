import { useEffect, useState } from 'react'

// 실제 진행률을 알 수 없는 기다림이다. 그래도 막대가 멈춰 있으면 멎은 것처럼 보여
// 끝에 가까워질수록 느려지게 밀어 올린다. 다 차면 끝난 줄 알기에 90%에서 멈춘다
const CEILING = 90
const TICK_MS = 180

interface LoadingScreenProps {
  // 무엇을 기다리는지 그대로 적는다. '로딩 중'보다 지금 무슨 일이 벌어지는지가 낫다
  message: string
  hint?: string
  // 화면 전체를 덮을지, 이미 그려진 화면 안 자리에 놓을지.
  // 주소를 직접 열어 아무것도 없을 때는 덮고, 목록만 기다릴 때는 그 자리에 둔다
  fullScreen?: boolean
  // 머무는 시간을 아는 경우에만 준다. 그때는 막대가 그 시간에 맞춰 차오른다.
  // 모르면 남은 거리를 조금씩 좁히며 90%에서 기다린다
  holdMs?: number
  // 이만큼 안에 끝나면 아예 보여주지 않는다. 새로고침처럼 금방 끝나는 기다림에
  // 판이 번쩍였다 사라지면 오히려 더 거슬린다
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
      // 끝나는 시점을 아니까 그 시간에 맞춰 고르게 채운다.
      // 일정 간격으로 끊어 올리면 막대가 계단처럼 움직여, 화면이 그리는 박자에 맞춰 잇는다
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
      // 남은 거리의 일부만 좁힌다 — 처음엔 성큼, 뒤로 갈수록 조금씩
      setProgress((current) => current + Math.max(0.6, (CEILING - current) * 0.12))
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [holdMs])

  if (!visible) return null

  return (
    <div className={fullScreen ? 'flex min-h-dvh items-center justify-center bg-primary-subtle p-6' : 'flex justify-center py-16'}>
      <div className="glass-panel w-full max-w-sm rounded-2xl px-8 py-10 text-center">
        <img
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
              // 정해진 시간에 맞춰 그릴 때는 프레임마다 값을 바꾸므로 전환을 걸지 않는다.
              // 걸면 프레임과 전환이 서로 밀려 오히려 덜컹인다
              className={`h-full rounded-full bg-primary ${
                holdMs ? '' : 'transition-[width] duration-300 ease-out motion-reduce:transition-none'
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
