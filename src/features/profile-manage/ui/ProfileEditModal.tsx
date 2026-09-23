import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline'

import type { MyProfile } from '../../../entities/user'
import { FIELD_LIMITS } from '../../../shared/config/field-limits'
import { shrinkImage } from '../../../shared/lib/image'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { PixelField, pixelInputClass, pixelInputStyle } from '../../../shared/ui/input'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getProfileUpdateErrorMessage, useUpdateMyProfile } from '../api/profile-api'

const { min: NICKNAME_MIN, max: NICKNAME_MAX } = FIELD_LIMITS.nickname

interface ProfileEditModalProps {
  profile: MyProfile
  onClose: () => void
}

export function ProfileEditModal({ profile, onClose }: ProfileEditModalProps) {
  const titleId = useId()
  const imageInputId = useId()
  const [nickname, setNickname] = useState(profile.nickname)
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // 사진을 지우는 것과 손대지 않는 것을 구분해야 해서 따로 기억한다
  const [removePhoto, setRemovePhoto] = useState(false)
  const [nicknameError, setNicknameError] = useState('')
  const [error, setError] = useState('')
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const imageRequest = useRef(0)
  const mutation = useUpdateMyProfile()
  const busy = mutation.isPending || isProcessingImage

  const shownImageUrl = previewUrl ?? (removePhoto ? null : profile.profileImageUrl)
  const hasPhoto = Boolean(shownImageUrl)

  // 미리보기 URL이 바뀌거나 모달을 닫을 때 이전 URL 메모리 해제
  useEffect(() => {
    if (!previewUrl) return
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  useEffect(() => () => { imageRequest.current += 1 }, [])

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    // 같은 파일을 지웠다가 다시 골라도 change가 발생하도록 입력값을 비움
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.')
      return
    }
    setError('')
    // 올리기 전에 줄여서 업로드 실패(413)와 긴 대기를 막음
    const request = ++imageRequest.current
    setIsProcessingImage(true)
    try {
      const processed = await shrinkImage(file)
      if (request !== imageRequest.current) return
      setImage(processed)
      setPreviewUrl(URL.createObjectURL(processed))
      setRemovePhoto(false)
    } finally {
      if (request === imageRequest.current) setIsProcessingImage(false)
    }
  }

  function handleRemovePhoto() {
    imageRequest.current += 1
    setImage(null)
    setPreviewUrl(null)
    // 서버에 올라가 있던 사진이 있을 때만 삭제를 요청한다
    setRemovePhoto(Boolean(profile.profileImageUrl))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const trimmed = nickname.trim()
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      setNicknameError(`닉네임은 ${NICKNAME_MIN}~${NICKNAME_MAX}자로 지어 주세요.`)
      return
    }

    setError('')
    try {
      await mutation.mutateAsync({ nickname: trimmed, image, deleteProfileImage: removePhoto })
      useToastStore.getState().showToast('프로필을 수정했어요')
      onClose()
    } catch (submitError) {
      setError(getProfileUpdateErrorMessage(submitError))
    }
  }

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="md">
      <h2 id={titleId} className="pr-5 text-head-03 font-bold text-text-strong">프로필 수정</h2>
      <p className="mt-2 text-body-04 text-text-muted">친구들에게 보이는 이름과 사진이에요.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar profileImageUrl={shownImageUrl} size="lg" />
              {hasPhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="프로필 사진 지우기"
                  title="프로필 사진 지우기"
                  style={{ clipPath: pixelBox(2) }}
                  className="absolute right-1 top-1 grid size-7 place-items-center bg-text-strong/75 text-white transition-colors hover:bg-text-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong"
                >
                  <XMarkIcon aria-hidden="true" className="size-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                aria-label={hasPhoto ? '프로필 사진 바꾸기' : '프로필 사진 올리기'}
                title={hasPhoto ? '프로필 사진 바꾸기' : '프로필 사진 올리기'}
                style={{ clipPath: pixelBox(2) }}
                className="absolute bottom-1 right-1 grid size-8 place-items-center bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong"
              >
                <CameraIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
            {isProcessingImage && (
              <p role="status" className="text-body-04 text-text-muted">사진을 준비하는 중이에요...</p>
            )}
          </div>
          <input
            ref={imageInputRef}
            id={imageInputId}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            tabIndex={-1}
            className="sr-only"
          />

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="profile-nickname" className="text-body-03 font-bold text-text-strong">
                닉네임 <span className="text-primary">*</span>
              </label>
              <span className="text-body-04 text-text-muted">{nickname.length}/{NICKNAME_MAX}</span>
            </div>
            <PixelField invalid={Boolean(nicknameError)} className="mt-2">
              <input
                id="profile-nickname"
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value)
                  setNicknameError('')
                }}
                maxLength={NICKNAME_MAX}
                placeholder="플리마켓에서 쓸 이름"
                aria-invalid={Boolean(nicknameError)}
                style={pixelInputStyle}
                className={`h-12 ${pixelInputClass}`}
              />
            </PixelField>
            {nicknameError && <p className="mt-2 text-body-04 text-red-600">{nicknameError}</p>}
          </div>
        </fieldset>

        {error && <p role="alert" className="text-body-04 text-red-600">{error}</p>}

        {/* 주요 동작을 왼쪽에 */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-primary/50"
          >
            {mutation.isPending ? '저장하는 중...' : '저장하기'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ clipPath: pixelBox(4) }}
            className="min-h-12 flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong"
          >
            취소
          </button>
        </div>
      </form>
    </Modal>
  )
}
