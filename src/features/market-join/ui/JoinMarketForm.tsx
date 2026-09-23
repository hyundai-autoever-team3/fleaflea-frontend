import { useState } from 'react'
import type { FormEvent } from 'react'

import { parseInviteCode } from '../../../shared/lib/invite'
import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { getJoinErrorMessage, useJoinMarket, type JoinMarketResponse } from '../api/market-join-api'

interface JoinMarketFormProps {
  onJoined: (market: JoinMarketResponse) => void
}

export function JoinMarketForm({ onJoined }: JoinMarketFormProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  // 내 마켓 목록 새로고침은 useJoinMarket 안에서 한다
  const joinMutation = useJoinMarket()
  const isSubmitting = joinMutation.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const inviteCode = parseInviteCode(value)
    if (!inviteCode) {
      setError('이 서비스의 초대 링크나 초대 코드를 입력해 주세요.')
      return
    }

    setError('')
    joinMutation.mutate(inviteCode, {
      onSuccess: onJoined,
      onError: (joinError) => setError(getJoinErrorMessage(joinError)),
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label htmlFor="join-invite-input" className="text-body-04 font-bold text-text-strong">
        초대 링크 또는 코드
      </label>
      <PixelField invalid={Boolean(error)} className="mt-2">
        <input
          id="join-invite-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setError('')
          }}
          placeholder="초대 링크 또는 코드 붙여넣기"
          maxLength={2048}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          style={pixelInputStyle}
          className={`h-12 ${pixelInputClass}`}
        />
      </PixelField>
      {error && <p className="mt-2 text-body-04 text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{ clipPath: pixelBox(4) }}
        className="mt-6 h-12 w-full bg-primary text-body-03 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
      >
        {isSubmitting ? '참여하는 중...' : '마켓 참여하기'}
      </button>
    </form>
  )
}
