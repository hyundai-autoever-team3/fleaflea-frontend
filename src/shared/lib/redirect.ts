// 로그인·가입 후 복귀할 경로를 쿼리 문자열에 보존한다.
const REDIRECT_PARAM = 'redirect'

// /로 시작하는 내부 경로만 허용하며, 외부 출처로 해석되는 // 경로는 제외한다.
export function toSafeRedirect(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null

  return value
}

export function readRedirect(search: string): string | null {
  return toSafeRedirect(new URLSearchParams(search).get(REDIRECT_PARAM))
}

export function withRedirect(path: string, redirectTo: string): string {
  const safe = toSafeRedirect(redirectTo)

  return safe ? `${path}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}` : path
}
