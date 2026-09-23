// 로그인·가입을 마친 뒤 돌아갈 곳을 주소에 실어 나른다.
// 초대 링크처럼 로그인 전에 들어온 화면이 있으면 그 자리로 되돌려 보내기 위함이다.
const REDIRECT_PARAM = 'redirect'

// 바깥 주소로 튕겨 보내는 데 쓰이지 않도록 우리 화면 경로만 허용한다.
// '//evil.com'은 브라우저가 다른 출처로 읽으므로 함께 막는다
export function toSafeRedirect(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}

export function readRedirect(search: string): string | null {
  return toSafeRedirect(new URLSearchParams(search).get(REDIRECT_PARAM))
}

// '/login?redirect=...' 처럼 돌아올 곳을 붙인 주소를 만든다
export function withRedirect(path: string, redirectTo: string): string {
  const safe = toSafeRedirect(redirectTo)
  return safe ? `${path}?${REDIRECT_PARAM}=${encodeURIComponent(safe)}` : path
}
