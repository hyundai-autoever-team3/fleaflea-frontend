import { useInfiniteQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { api } from '../../../shared/api/axios'
import type { PageResponse } from '../../../shared/api/page-response'
import type { ItemComment } from '../model/types'

export const COMMENT_PAGE_SIZE = 20
// 답글은 많지 않아 한 번에 받는다. 넘치면 '답글 더 보기'로 이어 받는다
export const REPLY_PAGE_SIZE = 100

export const itemCommentKeys = {
  all: ['item-comments'] as const,
  item: (itemId: number) => [...itemCommentKeys.all, itemId] as const,
  // parentId가 null이면 일반 댓글 목록, 숫자면 그 댓글의 대댓글 목록
  list: (itemId: number, parentId: number | null) =>
    [...itemCommentKeys.item(itemId), { parentId }] as const,
}

function retryUnlessClientError(failureCount: number, error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined

  if (status === 400 || status === 401 || status === 403 || status === 404) return false

  return failureCount < 3
}

// 오래된 순으로만 내려 준다. parentId를 넘기면 그 댓글의 대댓글만 조회한다
export function getItemComments(
  itemId: number,
  { parentId, page, size }: { parentId: number | null; page: number; size: number },
  signal?: AbortSignal,
) {
  return api.get<PageResponse<ItemComment>>(`/api/v1/items/${itemId}/comments`, {
    params: { parentId: parentId ?? undefined, page, size },
    signal,
  })
}

export function useItemComments(
  itemId: number,
  { parentId = null, enabled = true }: { parentId?: number | null; enabled?: boolean } = {},
) {
  const size = parentId === null ? COMMENT_PAGE_SIZE : REPLY_PAGE_SIZE

  return useInfiniteQuery({
    queryKey: itemCommentKeys.list(itemId, parentId),
    queryFn: async ({ pageParam, signal }) =>
      (await getItemComments(itemId, { parentId, page: pageParam, size }, signal)).data,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    enabled: enabled && Number.isInteger(itemId) && itemId > 0,
    retry: retryUnlessClientError,
  })
}
