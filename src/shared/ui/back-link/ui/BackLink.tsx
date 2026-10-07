import { Link, useLocation, useNavigate } from 'react-router'
import type { MouseEvent } from 'react'

import { useBackTarget, type BackTarget } from '../../../lib/back-target'

// 진입 경로가 기록돼 있으면 뒤로 가기로 목록의 스크롤과 페이지를 복원한다.
// 직접 접속한 경우에는 기본 경로로 이동한다.
export function BackLink({
  fallback,
  className = '',
}: {
  fallback: BackTarget
  className?: string
}) {
  const back = useBackTarget(fallback)
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as { from?: BackTarget } | null

  // 초기 기록의 key는 default다. from도 확인해 앱에서 연결한 이동에만 뒤로 가기를 쓴다.
  const canGoBack = location.key !== 'default' && state?.from !== undefined

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!canGoBack) return

    // 보조 클릭과 단축키를 이용한 새 탭 열기는 브라우저의 기본 동작을 유지한다.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return

    event.preventDefault()
    navigate(-1)
  }

  return (
    <Link
      to={back.to}
      viewTransition
      onClick={handleClick}
      className={`text-body-04 text-text-muted hover:text-text-strong ${className}`}
    >
      ← {back.label}
    </Link>
  )
}
