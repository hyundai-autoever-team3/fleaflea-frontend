import { useLocation } from 'react-router'

export interface BackTarget {
  to: string
  label: string
}

// 상세 화면의 "← 돌아가기"가 가리킬 곳.
// 같은 화면이라도 어디서 들어왔느냐에 따라 돌아갈 자리가 다르다(도감 목록에서 왔는지, 마이페이지 거래 목록에서 왔는지).
// 링크가 state.from으로 알려주면 그곳으로, 주소를 직접 열어 들어왔으면 화면의 기본값으로 보낸다
export function useBackTarget(fallback: BackTarget): BackTarget {
  const state = useLocation().state as { from?: BackTarget } | null
  const from = state?.from
  return from && typeof from.to === 'string' && typeof from.label === 'string' ? from : fallback
}
