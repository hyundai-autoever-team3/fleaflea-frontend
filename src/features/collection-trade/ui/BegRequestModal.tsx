import { useId, useState } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getBegRequestErrorMessage, useCreateBegRequest } from '../api/collection-trade-api'

interface BegRequestModalProps {
  open: boolean
  collectionItemId: number
  itemTitle: string
  onClose: () => void
}

const MAX_STORY = 1000

// 구걸은 내 물건을 걸지 않고 사연만 보낸다 (Swagger BeggingRequest: story 필수)
export function BegRequestModal({ open, collectionItemId, itemTitle, onClose }: BegRequestModalProps) {
  const id = useId()
  const [story, setStory] = useState('')
  const [error, setError] = useState('')
  const mutation = useCreateBegRequest(collectionItemId)

  function close() {
    setStory('')
    setError('')
    onClose()
  }

  async function handleSubmit() {
    const trimmed = story.trim()
    if (!trimmed) {
      setError('사연을 입력해 주세요.')
      return
    }
    setError('')
    try {
      await mutation.mutateAsync(trimmed)
      useToastStore.getState().showToast('구걸 요청을 보냈어요')
      close()
    } catch (submitError) {
      setError(getBegRequestErrorMessage(submitError))
    }
  }

  return (
    <Modal open={open} onRequestClose={close} labelledBy="beg-request-title" showClose={false}>
      <h2 id="beg-request-title" className="text-head-03 font-bold text-text-strong">
        구걸하기
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">
        <span className="font-bold text-text-strong">{itemTitle}</span>
        <span className="px-1">·</span>
        갖고 싶은 마음을 사연으로 전해요
      </p>

      <div className="mt-6">
        <label htmlFor={`${id}-story`} className="text-body-03 font-bold text-text-strong">
          사연 <span className="text-primary">*</span>
        </label>
        <PixelField invalid={Boolean(error)} className="mt-2">
          <textarea
            id={`${id}-story`}
            value={story}
            onChange={(event) => {
              setStory(event.target.value)
              setError('')
            }}
            rows={5}
            maxLength={MAX_STORY}
            required
            placeholder="이 물건이 왜 갖고 싶은지 적어 주세요."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-story-error` : undefined}
            style={pixelInputStyle}
            className={`resize-y py-3 disabled:opacity-60 ${pixelInputClass}`}
          />
        </PixelField>
        <p className="mt-2 text-right text-body-04 text-text-muted">
          {story.length} / {MAX_STORY}
        </p>
        {error && (
          <p id={`${id}-story-error`} role="alert" className="mt-2 text-body-04 text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={mutation.isPending}
          style={{ clipPath: pixelBox(4) }}
          className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
        >
          {mutation.isPending ? '보내는 중...' : '구걸 요청 보내기'}
        </button>
        <button
          type="button"
          onClick={close}
          style={{ clipPath: pixelBox(4) }}
          className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
        >
          취소
        </button>
      </div>
    </Modal>
  )
}
