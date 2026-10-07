import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 화면 이동 시 1분간 캐시를 재사용한다. 변경된 데이터는 각 mutation에서 무효화한다.
      staleTime: 60_000,
      // 탭으로 돌아올 때 생기는 불필요한 재조회를 줄인다.
      refetchOnWindowFocus: false,
    },
  },
})
