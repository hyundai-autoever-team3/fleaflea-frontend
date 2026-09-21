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

// 거래 목록에서 들어왔다면 그 줄의 상태도 함께 온다.
// 물건 응답만으로는 "이 거래가 이미 끝났다"를 알 수 없어, 들어온 길이 알려준다
export function useIncomingTradeStatus(): string | null {
  const state = useLocation().state as { tradeStatus?: string } | null
  return typeof state?.tradeStatus === 'string' ? state.tradeStatus : null
}

// 진행 중이거나 끝난 거래를 거쳐 들어왔다면 새 요청을 받을 자리가 아니다.
// 거절·취소는 물건이 다시 자유로워진 것이므로 막지 않는다
export function isSettledTradeStatus(status: string | null) {
  return status === 'ACCEPTED' || status === 'COMPLETED'
}
