const CODE_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/
const INVITE_PATH_PATTERN = /^\/invite\/([a-zA-Z0-9_-]{1,128})\/?$/

// 초대 코드 또는 이 서비스의 초대 링크(/invite/코드)에서 코드만 꺼냄. 형식이 맞지 않으면 null
export function parseInviteCode(input: string): string | null {
  const value = input.trim()
  if (!value) return null
  if (CODE_PATTERN.test(value)) return value

  try {
    const url = new URL(value, window.location.origin)
    const match = url.pathname.match(INVITE_PATH_PATTERN)
    if (url.origin !== window.location.origin || !match) return null
    return match[1]
  } catch {
    return null
  }
}
