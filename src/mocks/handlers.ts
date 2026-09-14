import { HttpResponse, http } from 'msw'

import type { User } from '../entities/user'

const mockUser: User = {
  memberId: 1,
  email: 'test@fleaflea.com',
  nickname: '테스트유저',
  profileImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

// '*'로 시작하는 경로는 origin(baseURL) 상관없이 매칭됨 — 실제 백엔드 나오면 이 파일만 지우면 됨.
export const handlers = [
  http.post('*/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }

    if (body.email === mockUser.email && body.password === 'password123') {
      return HttpResponse.json({ token: 'mock-token-123', user: mockUser })
    }

    return HttpResponse.json(
      { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
      { status: 401 },
    )
  }),

  http.post('*/auth/signup', async ({ request }) => {
    const body = (await request.json()) as { email: string; nickname: string; password: string }

    return HttpResponse.json({
      token: 'mock-token-123',
      user: { ...mockUser, email: body.email, nickname: body.nickname },
    })
  }),
]
