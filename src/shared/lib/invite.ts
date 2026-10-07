const CODE_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/
const INVITE_PATH_PATTERN = /^\/invite\/([a-zA-Z0-9_-]{1,128})\/?$/

// 코드 자체와 같은 출처의 /invite/:code 링크만 허용한다.
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
