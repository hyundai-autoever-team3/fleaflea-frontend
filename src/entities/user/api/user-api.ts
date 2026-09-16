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
    // 토큰이 유효하지 않으면(401/403) 재시도해도 같으니 바로 실패시켜 로그인으로 보냄
    retry: (failureCount, error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === 401 || status === 403) return false
      return failureCount < 3
    },
  })
}
