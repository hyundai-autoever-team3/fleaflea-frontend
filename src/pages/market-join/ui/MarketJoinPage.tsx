import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import {
  getJoinErrorMessage,
  isAlreadyJoinedError,
  useJoinMarket,
} from '../../../features/market-join'
import { parseInviteCode } from '../../../shared/lib/invite'
import { withRedirect } from '../../../shared/lib/redirect'
import { LoadingScreen } from '../../../shared/ui/loading-screen'
import { pixelBox } from '../../../shared/lib/pixel'

// 참여 전에는 마켓 상세를 조회할 수 없으므로 초대 코드만으로 참여를 요청한다.
export function MarketJoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const accessToken = useSessionStore((state) => state.accessToken)

  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)

  const inviteCode = parseInviteCode(code)
  const joinMutation = useJoinMarket()
  const isJoining = joinMutation.isPending

  // 초대 화면에서 로그인·가입 후 돌아온 경우에만 확인 단계를 생략한다.
  const shouldAutoJoin = new URLSearchParams(location.search).get('join') === '1'
  const authPathWithReturn = (path: string) => withRedirect(path, `/invite/${code}?join=1`)

  const autoJoinedRef = useRef(false)

  useEffect(() => {
    if (!shouldAutoJoin || !accessToken || !inviteCode || autoJoinedRef.current) return

    autoJoinedRef.current = true
    handleJoin()
    // ref로 중복 자동 참여를 막으므로 렌더마다 바뀌는 handleJoin은 의존성에서 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, inviteCode, shouldAutoJoin])

  // 자동 참여 안내의 최소 노출 시간이다. 수동 참여에는 이동 지연을 적용하지 않는다.
  const AUTO_JOIN_HOLD_MS = 1800

  function handleJoin() {
    if (!inviteCode) return

    setError('')

    const startedAt = Date.now()
    const goAfterHold = (to: string) => {
      const waited = Date.now() - startedAt
      const remaining = shouldAutoJoin ? Math.max(0, AUTO_JOIN_HOLD_MS - waited) : 0

      window.setTimeout(() => navigate(to, { replace: true }), remaining)
    }

    joinMutation.mutate(inviteCode, {
      onSuccess: (market) => goAfterHold(`/market/${market.marketId}`),
      onError: (joinError) => {
        const joined = isAlreadyJoinedError(joinError)

        // 이미 참여한 마켓의 오류 응답에는 ID가 없어 자동 참여 시 목록으로 이동한다.
        if (joined && shouldAutoJoin) {
          goAfterHold('/market')
          return
        }

        setAlreadyJoined(joined)
        setError(getJoinErrorMessage(joinError))
      },
    })
  }

  if (shouldAutoJoin && accessToken && inviteCode && !error) {
    return (
      <LoadingScreen
        message="마켓에 참여하는 중이에요"
        hint="곧 마켓으로 들어갈게요."
        holdMs={AUTO_JOIN_HOLD_MS}
      />
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary-subtle p-6">
      <div className="w-full max-w-md drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
        <div style={{ clipPath: pixelBox(6) }} className="bg-bg px-8 py-10 text-center">
          <img
            draggable={false}
            src="/mascot/flea10.png"
            alt=""
            className="mx-auto h-24 object-contain [image-rendering:pixelated]"
          />
          <h1 className="mt-4 text-head-03 font-bold text-text-strong">
            {!inviteCode
              ? '링크를 확인해 주세요'
              : accessToken
                ? '이 마켓에 참여할까요?'
                : '초대받은 마켓이에요'}
          </h1>

          {!inviteCode ? (
            <>
              <p className="mt-2 text-body-03 text-text-muted">
                초대 링크가 올바르지 않아요. 친구에게 링크를 다시 받아 주세요.
              </p>
              <Link
                to="/"
                style={{ clipPath: pixelBox(4) }}
                className="mt-8 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
              >
                처음으로
              </Link>
            </>
          ) : !accessToken ? (
            <>
              <p className="mt-2 text-body-03 text-text-muted">
                로그인하면 이 마켓으로 바로 들어가요.
              </p>
              <Link
                to={authPathWithReturn('/login')}
                style={{ clipPath: pixelBox(4) }}
                className="mt-8 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
              >
                로그인하기
              </Link>
              <p className="mt-4 text-body-04 text-text-muted">
                아직 계정이 없으신가요?{' '}
                <Link to={authPathWithReturn('/signup')} className="font-bold text-primary">
                  회원가입
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-body-03 text-text-muted">
                참여하면 마켓 정보와 참여자를 확인할 수 있어요.
              </p>
              {error && <p className="mt-4 text-body-04 text-red-600">{error}</p>}
              {alreadyJoined ? (
                <Link
                  to="/market"
                  style={{ clipPath: pixelBox(4) }}
                  className="mt-8 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
                >
                  내 마켓 보러 가기
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining}
                  style={{ clipPath: pixelBox(4) }}
                  className="mt-8 h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                >
                  {isJoining ? '참여하는 중...' : '마켓 참여하기'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
