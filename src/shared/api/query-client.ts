import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본값(0)이면 화면을 열 때마다 모든 쿼리를 다시 받는다.
      // 화면을 오갈 때 같은 목록을 반복해서 받지 않도록 1분간은 받아둔 값을 쓴다.
      // 내가 바꾼 내용은 각 mutation의 invalidateQueries가 즉시 반영하므로 이 시간과 무관하다
      staleTime: 60_000,
      // 다른 탭에 갔다 돌아올 때마다 화면의 모든 쿼리를 다시 받지 않는다
      refetchOnWindowFocus: false,
    },
  },
})
