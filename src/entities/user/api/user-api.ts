import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'

// GET /api/v1/members/me
export interface MyProfile {
  memberId: number
  email: string
  nickname: string
  profileImageUrl: string | null
}

export const userKeys = {
  me: ['me'] as const,
}

export function getMyProfile() {
  return api.get<MyProfile>('/api/v1/members/me')
}

export function useMyProfile() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: async () => (await getMyProfile()).data,
    // 인증·권한 오류는 재시도 없이 호출부에 전달한다.
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined

      if (status === 401 || status === 403) return false

      return failureCount < 3
    },
  })
}
