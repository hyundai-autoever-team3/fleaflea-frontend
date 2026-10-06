import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { userKeys } from '../../../entities/user'
import { api } from '../../../shared/api/axios'
import { getImageErrorMessage } from '../../../shared/lib/image'

export interface ProfileUpdatePayload {
  nickname: string
  image: File | null
  // 새 이미지가 없을 때 기존 사진을 유지할지 삭제할지 구분한다.
  deleteProfileImage: boolean
}

export interface PasswordUpdatePayload {
  currentPassword: string
  newPassword: string
}

// PATCH /api/v1/members/me (multipart/form-data). 204를 돌려주므로 응답 본문이 없다
export function updateMyProfile({ nickname, image, deleteProfileImage }: ProfileUpdatePayload) {
  const formData = new FormData()

  formData.append('nickname', nickname)
  if (image) formData.append('profileImage', image)

  // 필수 boolean 필드이므로 false도 생략하지 않고 전송한다.
  formData.append('deleteProfileImage', String(deleteProfileImage))

  return api.patch<void>('/api/v1/members/me', formData)
}

export function updateMyPassword(payload: PasswordUpdatePayload) {
  return api.patch<void>('/api/v1/members/me/password', payload)
}

export function withdrawMe() {
  return api.delete<void>('/api/v1/members/me')
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateMyProfile,
    // 헤더와 마이페이지가 공유하는 프로필 캐시를 갱신한다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.me }),
  })
}

export function useUpdateMyPassword() {
  return useMutation({ mutationFn: updateMyPassword })
}

export function useWithdrawMe() {
  return useMutation({ mutationFn: withdrawMe })
}

export function getProfileUpdateErrorMessage(error: unknown) {
  const response = isAxiosError<{ code?: string }>(error) ? error.response : undefined

  // HTTP 상태보다 구체적인 이미지 오류 코드를 우선한다.
  const imageMessage = getImageErrorMessage(response?.data?.code)
  if (imageMessage) return imageMessage

  switch (response?.status) {
    case 400:
      return '입력한 내용을 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '회원 정보를 찾을 수 없어요.'
    case 409:
      return '이미 쓰고 있는 닉네임이에요. 다른 닉네임을 지어 주세요.'
    default:
      return '프로필을 수정하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function getPasswordUpdateErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    // 현재 비밀번호 불일치와 형식 오류가 모두 400으로 반환된다.
    case 400:
      return '현재 비밀번호가 맞지 않아요. 다시 확인해 주세요.'
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '회원 정보를 찾을 수 없어요.'
    default:
      return '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}

export function getWithdrawErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  switch (status) {
    case 401:
      return '로그인이 필요해요. 다시 로그인해 주세요.'
    case 404:
      return '회원 정보를 찾을 수 없어요.'
    default:
      return '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
}
