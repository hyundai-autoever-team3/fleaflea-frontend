import { Link, useLocation, useNavigate } from 'react-router'
import type { MouseEvent } from 'react'

import { useBackTarget, type BackTarget } from '../../../lib/back-target'

// 상세 화면의 "← 돌아가기". 어디서 들어왔느냐에 따라 돌아갈 자리가 달라진다.
//
// 링크를 눌러 들어왔다면 되돌아가기는 곧 뒤로 가기다. 새 기록을 쌓아 이동하면
// 목록이 맨 위에서 다시 그려져 보던 자리를 잃는다. 뒤로 가야 스크롤 위치와
// 목록의 몇 쪽을 보고 있었는지가 그대로 되살아난다.
// 주소를 직접 열어 들어왔다면 돌아갈 기록이 없으므로 그냥 그 자리로 이동한다
export function BackLink({ fallback, className = '' }: { fallback: BackTarget; className?: string }) {
  const back = useBackTarget(fallback)
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as { from?: BackTarget } | null
  // key가 'default'면 이 기록이 세션의 첫 화면이라 뒤로 갈 곳이 없다
  const canGoBack = location.key !== 'default' && state?.from !== undefined

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!canGoBack) return
    // 새 탭으로 열기 같은 조작은 브라우저에 맡긴다
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
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
