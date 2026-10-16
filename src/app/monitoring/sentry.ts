import * as Sentry from '@sentry/react'

import { env } from '../../shared/config/env'

export function initSentry() {
  if (!import.meta.env.PROD || !env.sentryDsn) return

  Sentry.init({
    dsn: env.sentryDsn,
    environment: import.meta.env.MODE,
    ignoreErrors: [
      // 화면 전환 애니메이션이 끝나기 전에 다음 이동이 시작되면 브라우저가 앞의 애니메이션을 취소한다.
      // 이동은 정상으로 끝나서 사용자에게 보이는 문제가 없다
      'Old view transition aborted by new view transition',
      // 탭을 숨기는 등 애니메이션을 그릴 수 없을 때 브라우저가 건너뛴다. 이것도 이동은 정상이다
      /view transition.*(skipped|hidden)|transition was skipped/i,
    ],
  })
}
