import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { userKeys } from '../../../entities/user'
import { api } from '../../../shared/api/axios'

export interface ProfileUpdatePayload {
  nickname: string
  image: File | null
  // 사진을 지우는 것과 그대로 두는 것은 다르다. 서버가 이 값으로 구분한다
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
  if (deleteProfileImage) formData.append('deleteProfileImage', 'true')

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
    // 헤더·마이페이지가 함께 보는 내 정보라 수정 후 다시 받아온다
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
  const status = isAxiosError(error) ? error.response?.status : undefined
  switch (status) {
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
    // 서버가 현재 비밀번호 불일치와 형식 오류를 모두 400으로 내려, 더 흔한 쪽을 문구로 삼는다
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
