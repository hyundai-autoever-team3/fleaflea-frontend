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
    return api.post('/auth/signup', payload)
}

export function login(payload: LoginPayload){
    return api.post('/auth/login', payload)
}
export function reissue(refreshToken: string){
    return api.post<{ accessToken: string}>('/auth/reissue', {refreshToken })
}