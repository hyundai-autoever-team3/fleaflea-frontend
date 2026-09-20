import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { getJoinErrorMessage, isAlreadyJoinedError, useJoinMarket } from '../../../features/market-join'
import { parseInviteCode } from '../../../shared/lib/invite'
import { pixelBox } from '../../../shared/lib/pixel'

// 로그인 전에도 들어올 수 있는 /invite/:code. 참여 전에는 마켓 상세를 볼 수 없어서(403) 코드만으로 참여시킴
export function MarketJoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const accessToken = useSessionStore((state) => state.accessToken)

  const [error, setError] = useState('')
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const inviteCode = parseInviteCode(code)
  // 내 마켓 목록 새로고침은 useJoinMarket 안에서 한다
  const joinMutation = useJoinMarket()
  const isJoining = joinMutation.isPending

  function handleJoin() {
    if (!inviteCode) return
    setError('')
    joinMutation.mutate(inviteCode, {
      onSuccess: (market) => navigate(`/market/${market.marketId}`, { replace: true }),
      onError: (joinError) => {
        setAlreadyJoined(isAlreadyJoinedError(joinError))
        setError(getJoinErrorMessage(joinError))
      },
    })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-subtle p-6">
      <div className="w-full max-w-md drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
        <div style={{ clipPath: pixelBox(6) }} className="bg-bg px-8 py-10 text-center">
          <img src="/mascot/flea10.png" alt="" className="mx-auto h-24 object-contain [image-rendering:pixelated]" />
          <h1 className="mt-4 text-head-03 font-bold text-text-strong">마켓 초대가 도착했어요</h1>

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
              <p className="mt-2 text-body-03 text-text-muted">로그인하면 친구가 연 마켓에 참여할 수 있어요.</p>
              <p className="mt-1 text-body-04 text-text-muted">로그인 후 이 초대 링크를 다시 열어 주세요.</p>
              <Link
                to="/login"
                style={{ clipPath: pixelBox(4) }}
                className="mt-8 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
              >
                로그인하기
              </Link>
              <p className="mt-4 text-body-04 text-text-muted">
                아직 계정이 없으신가요?{' '}
                <Link to="/signup" className="font-bold text-primary">
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
