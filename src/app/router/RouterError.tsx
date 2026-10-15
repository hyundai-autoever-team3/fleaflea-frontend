import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { MASCOTS } from '../../shared/config/mascots'
import { pixelBox } from '../../shared/lib/pixel'

// 라우터가 잡은 오류를 보여 준다. 화면을 그리다 난 오류는 라우터가 먼저 잡아서
// 여기서 직접 Sentry로 보내야 기록된다
export function RouterError() {
  const error = useRouteError()
  // 없는 주소로 들어오면 라우터가 404 응답을 오류로 넘긴다
  const isNotFound = isRouteErrorResponse(error) && error.status === 404

  useEffect(() => {
    // 없는 주소는 코드 오류가 아니라서 보내지 않는다
    if (!isNotFound) Sentry.captureException(error)
  }, [error, isNotFound])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <img
        draggable={false}
        src={MASCOTS.surprised}
        alt=""
        className="h-24 object-contain [image-rendering:pixelated]"
      />
      <p className="mt-4 text-body-03 font-bold text-text-strong">
        {isNotFound ? '없는 페이지예요' : '화면을 불러오지 못했어요'}
      </p>
      <p className="mt-1 text-body-04 text-text-muted">
        {isNotFound ? '주소를 다시 확인해 주세요.' : '새로고침하면 대부분 다시 열려요.'}
      </p>

      <div className="mt-6 flex gap-2">
        {!isNotFound && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ clipPath: pixelBox() }}
            className="bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
          >
            새로고침
          </button>
        )}
        <Link
          to="/"
          style={{ clipPath: pixelBox() }}
          className="bg-primary-subtle px-5 py-2.5 text-body-04 font-bold text-primary hover:bg-primary-tint"
        >
          처음으로
        </Link>
      </div>
    </div>
  )
}
