import { api } from '../../../shared/api/axios'

export interface SignupPayload {
    email: string
    password: string
    nickname : string
    profileImageUrl?: null
}

export interface LoginPayload {
    email: string
    password: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
}

export function signup(payload: SignupPayload){
    return api.post('/api/v1/auth/signup', payload)
}

export function login(payload: LoginPayload){
    return api.post('/api/v1/auth/login', payload)
}
export function reissue(refreshToken: string){
    return api.post<{ accessToken: string}>('/api/v1/auth/reissue', {refreshToken })
}

// DELETE /api/v1/auth/logout — 서버에 저장된 refresh token을 지운다.
// 실패하더라도 로컬 세션은 비워야 하므로 호출한 쪽에서 결과를 기다리되 에러는 삼킨다
export function logout(){
    return api.delete('/api/v1/auth/logout')
}
