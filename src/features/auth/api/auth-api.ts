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

// 리프레시 토큰은 응답 본문이 아니라 HttpOnly 쿠키로 온다. 자바스크립트로 읽을 수 없고
// 읽을 필요도 없다 — 재발급 요청에 브라우저가 알아서 실어 보낸다
export interface AuthTokens {
    accessToken: string
}

export function signup(payload: SignupPayload){
    return api.post('/api/v1/auth/signup', payload)
}

export function login(payload: LoginPayload){
    return api.post('/api/v1/auth/login', payload)
}

// DELETE /api/v1/auth/logout — 서버가 저장된 refresh token을 지우고 쿠키도 만료시킨다.
// 실패하더라도 로컬 세션은 비워야 하므로 호출한 쪽에서 결과를 기다리되 에러는 삼킨다
export function logout(){
    return api.delete('/api/v1/auth/logout')
}
