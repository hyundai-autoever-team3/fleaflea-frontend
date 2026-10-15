import * as Sentry from '@sentry/react'

import { env } from '../../shared/config/env'

export function initSentry() {
  if (!import.meta.env.PROD || !env.sentryDsn) return

  Sentry.init({
    dsn: env.sentryDsn,
    environment: import.meta.env.MODE,
  })
}
