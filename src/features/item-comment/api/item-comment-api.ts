import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import type { ItemComment } from '../../../entities/item-comment'
import { itemCommentKeys } from '../../../entities/item-comment'
import { api } from '../../../shared/api/axios'

// 서버와 같은 제한. 앞뒤 공백은 서버가 지우고 저장한다
export const COMMENT_MAX_LENGTH = 2000

// POST /api/v1/items/{itemId}/comments. parentId를 넣으면 대댓글이 된다
export function createItemComment(itemId: number, payload: { content: string; parentId?: number }) {
  return api.post<ItemComment>(`/api/v1/items/${itemId}/comments`, payload)
}

export function updateItemComment(itemId: number, commentId: number, content: string) {
  return api.patch<ItemComment>(`/api/v1/items/${itemId}/comments/${commentId}`, { content })
}

// 일반 댓글을 지우면 달린 대댓글도 서버에서 함께 지워진다
export function deleteItemComment(itemId: number, commentId: number) {
  return api.delete(`/api/v1/items/${itemId}/comments/${commentId}`)
}

export function getItemCommentErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ code?: string }>(error)) {
    const code = error.response?.data?.code

    if (code === 'MARKET_NOT_PARTICIPANT') return '마켓에 참여해야 댓글을 쓸 수 있어요.'
    if (code === 'ITEM_COMMENT_NOT_OWNER') return '내가 쓴 댓글만 고치거나 지울 수 있어요.'
    if (code === 'ITEM_COMMENT_NOT_FOUND') return '이미 삭제된 댓글이에요.'
    if (code === 'ITEM_NOT_FOUND') return '삭제된 상품이에요.'
    if (error.response?.status === 400) return '댓글 내용을 확인해 주세요.'
  }

  return fallback
}

// 답글 수와 목록이 함께 바뀌므로 이 상품의 댓글 목록을 모두 새로 받는다.
// 새로 받기까지 기다려야 버튼이 풀린 뒤 바뀐 목록이 바로 보인다
function useRefreshComments(itemId: number) {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: itemCommentKeys.item(itemId) })
}

export function useCreateItemComment(itemId: number) {
  const refresh = useRefreshComments(itemId)

  return useMutation({
    mutationFn: async (payload: { content: string; parentId?: number }) =>
      (await createItemComment(itemId, payload)).data,
    onSuccess: refresh,
  })
}

export function useUpdateItemComment(itemId: number) {
  const refresh = useRefreshComments(itemId)

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) =>
      (await updateItemComment(itemId, commentId, content)).data,
    onSuccess: refresh,
  })
}

export function useDeleteItemComment(itemId: number) {
  const refresh = useRefreshComments(itemId)

  return useMutation({
    mutationFn: (commentId: number) => deleteItemComment(itemId, commentId),
    // 이미 지워진 댓글이어도 목록은 맞춰 둔다
    onSettled: refresh,
  })
}
