import { useLocation } from 'react-router'

export interface BackTarget {
  to: string
  label: string
}

// 진입 링크의 state.from을 우선 사용하고, 직접 접속했거나 값이 잘못됐으면 기본 경로를 쓴다.
export function useBackTarget(fallback: BackTarget): BackTarget {
  const state = useLocation().state as { from?: BackTarget } | null
  const from = state?.from

  return from && typeof from.to === 'string' && typeof from.label === 'string' ? from : fallback
}
