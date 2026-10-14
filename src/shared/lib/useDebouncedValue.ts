import { useEffect, useState } from 'react'

// 값이 delay 동안 바뀌지 않았을 때만 새 값을 돌려준다.
// 검색어처럼 글자마다 바뀌는 값으로 서버에 요청할 때 마지막 입력만 보내기 위해 쓴다
export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
