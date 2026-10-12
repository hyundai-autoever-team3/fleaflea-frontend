import { Link, useSearchParams } from 'react-router'

import { AuthCard, getOAuthFailureMessage } from '../../../features/auth'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'

export function OAuthFailurePage() {
  const [searchParams] = useSearchParams()

  return (
    <AuthCard
      mascot={MASCOTS.surprised}
      title="로그인하지 못했어요"
      description={getOAuthFailureMessage(searchParams.get('error'))}
    >
      <Link
        to="/login"
        replace
        style={{ clipPath: pixelBox(4) }}
        className="mt-8 block h-12 bg-primary text-body-03 font-bold leading-[3rem] text-white hover:bg-primary/90"
      >
        로그인으로 돌아가기
      </Link>
    </AuthCard>
  )
}
