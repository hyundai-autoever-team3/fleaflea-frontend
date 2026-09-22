import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { getJoinErrorMessage, isAlreadyJoinedError, useJoinMarket } from '../../../features/market-join'
import { parseInviteCode } from '../../../shared/lib/invite'
import { withRedirect } from '../../../shared/lib/redirect'
import { LoadingScreen } from '../../../shared/ui/loading-screen'
import { pixelBox } from '../../../shared/lib/pixel'

// 로그인 전에도 들어올 수 있는 /invite/:code. 참여 전에는 마켓 상세를 볼 수 없어서(403) 코드만으로 참여시킴
export function MarketJoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const accessToken = useSessionStore((state) => state.accessToken)

  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const inviteCode = parseInviteCode(code)
  // 내 마켓 목록 새로고침은 useJoinMarket 안에서 한다
  const joinMutation = useJoinMarket()
  const isJoining = joinMutation.isPending
  // 로그인·가입을 마치고 이 링크로 돌아온 경우에만 바로 참여시킨다.
  // 그냥 링크를 연 사람에게는 참여 버튼을 눌러 확인받는다
  const shouldAutoJoin = new URLSearchParams(location.search).get('join') === '1'
  const authPathWithReturn = (path: string) => withRedirect(path, `/invite/${code}?join=1`)

  const autoJoinedRef = useRef(false)
  useEffect(() => {
    if (!shouldAutoJoin || !accessToken || !inviteCode || autoJoinedRef.current) return
    autoJoinedRef.current = true
    handleJoin()
    // handleJoin은 렌더마다 새로 만들어지지만, 위 ref가 한 번만 돌게 막는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, inviteCode, shouldAutoJoin])

  // 참여 자체는 금방 끝나 안내 화면이 스쳐 지나간다. 무슨 일이 일어났는지 읽을 틈을
  // 주려고 자동 참여일 때만 이만큼은 머무른다. 직접 누른 경우는 곧바로 넘어간다.
  // 글을 한 번 읽을 만큼만 잡았다 — 더 길면 멈춘 것처럼 느껴진다
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
      // 초대 링크를 누른 사람은 그 마켓을 보러 온 것이다. 목록에 내려놓지 않고
      // 방금 들어간 마켓 안으로 바로 데려간다
      onSuccess: (market) => goAfterHold(`/market/${market.marketId}`),
      onError: (joinError) => {
        const joined = isAlreadyJoinedError(joinError)
        // 로그인을 거쳐 돌아온 길이라면 묻지 않고 통과시킨다. 이미 들어가 있는
        // 마켓이라고 굳이 멈춰 세울 이유가 없다.
        // 다만 이 응답에는 마켓 번호가 없어 어디로 갈지 알 수 없으므로 목록으로 보낸다
        if (joined && shouldAutoJoin) {
          goAfterHold('/market')
          return
        }
        setAlreadyJoined(joined)
        setError(getJoinErrorMessage(joinError))
      },
    })
  }

  // 로그인을 마치고 돌아온 길에서는 확인 카드를 띄우지 않는다.
  // 이미 초대 링크를 눌러 로그인까지 한 사람에게 다시 묻는 건 한 단계가 헛돈다
  if (shouldAutoJoin && accessToken && inviteCode && !error) {
    return <LoadingScreen message="마켓에 참여하는 중이에요" hint="곧 마켓으로 들어갈게요." holdMs={AUTO_JOIN_HOLD_MS} />
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-primary-subtle p-6">
      <div className="w-full max-w-md drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
        <div style={{ clipPath: pixelBox(6) }} className="bg-bg px-8 py-10 text-center">
          <img src="/mascot/flea10.png" alt="" className="mx-auto h-24 object-contain [image-rendering:pixelated]" />
          <h1 className="mt-4 text-head-03 font-bold text-text-strong">
            {!inviteCode ? '링크를 확인해 주세요' : accessToken ? '이 마켓에 참여할까요?' : '초대받은 마켓이에요'}
          </h1>

          {!inviteCode ? (
            <>
              <p className="mt-2 text-body-03 text-text-muted">초대 링크가 올바르지 않아요. 친구에게 링크를 다시 받아 주세요.</p>
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
              <p className="mt-2 text-body-03 text-text-muted">로그인하면 이 마켓으로 바로 들어가요.</p>
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
              <p className="mt-2 text-body-03 text-text-muted">참여하면 마켓 정보와 참여자를 확인할 수 있어요.</p>
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
