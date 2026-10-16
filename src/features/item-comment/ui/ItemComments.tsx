import { useState } from 'react'

import type { ItemComment } from '../../../entities/item-comment'
import { useItemComments } from '../../../entities/item-comment'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import {
  getItemCommentErrorMessage,
  useCreateItemComment,
  useDeleteItemComment,
} from '../api/item-comment-api'
import { CommentForm } from './CommentForm'
import { CommentThread } from './CommentThread'

// 상품 상세 아래 댓글 영역. 마켓 참여자만 보고 쓸 수 있고, 오래된 순으로 쌓인다
export function ItemComments({ itemId }: { itemId: number }) {
  const commentsQuery = useItemComments(itemId)
  const createMutation = useCreateItemComment(itemId)
  const deleteMutation = useDeleteItemComment(itemId)
  // 닫히는 동안 문구가 바뀌지 않게 대상은 닫아도 남겨 둔다
  const [deleteTarget, setDeleteTarget] = useState<ItemComment | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const pages = commentsQuery.data?.pages
  const comments = pages?.flatMap((page) => page.content) ?? []
  const total = pages?.[0]?.totalElements ?? 0

  async function handleCreate(content: string) {
    try {
      await createMutation.mutateAsync({ content })
    } catch (error) {
      return getItemCommentErrorMessage(
        error,
        '댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }

    // 새 댓글은 맨 끝에 붙는다. 아직 안 받은 페이지가 있으면 끝까지 받아 방금 쓴 댓글을 보여 준다
    let result = await commentsQuery.fetchNextPage()
    while (result.hasNextPage) result = await result.fetchNextPage()

    return undefined
  }

  function openDelete(comment: ItemComment) {
    setDeleteError('')
    setDeleteTarget(comment)
    setIsDeleteOpen(true)
  }

  function handleDelete() {
    if (!deleteTarget) return

    deleteMutation.mutate(deleteTarget.commentId, {
      onSuccess: () => {
        setIsDeleteOpen(false)
        useToastStore.getState().showToast('댓글을 삭제했어요')
      },
      onError: (error) =>
        setDeleteError(getItemCommentErrorMessage(error, '댓글을 삭제하지 못했어요.')),
    })
  }

  return (
    <section aria-labelledby="item-comments-title" className="mt-14 max-w-3xl">
      <h2 id="item-comments-title" className="text-head-03 font-bold text-text-strong">
        댓글 {total > 0 && <span className="text-primary">{total}</span>}
      </h2>

      {commentsQuery.isError ? (
        <p className="py-8 text-body-04 text-text-muted">댓글을 불러오지 못했어요.</p>
      ) : commentsQuery.isPending ? (
        <p className="py-8 text-body-04 text-text-muted">댓글을 불러오는 중이에요...</p>
      ) : comments.length === 0 ? (
        <p className="py-8 text-body-04 text-text-muted">아직 댓글이 없어요.</p>
      ) : (
        <ul className="mt-2 divide-y divide-primary-subtle">
          {comments.map((comment) => (
            <CommentThread key={comment.commentId} comment={comment} onDelete={openDelete} />
          ))}
        </ul>
      )}

      {commentsQuery.hasNextPage && (
        <button
          type="button"
          onClick={() => void commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          style={{ clipPath: pixelBox(2) }}
          className="mt-2 h-10 w-full bg-primary-subtle text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong disabled:opacity-60"
        >
          {commentsQuery.isFetchingNextPage ? '불러오는 중' : '댓글 더 보기'}
        </button>
      )}

      {/* 오래된 순이라 새 댓글이 붙는 맨 아래에 입력 칸을 둔다 */}
      <div className="mt-4">
        <CommentForm
          placeholder="상품에 대해 궁금한 점을 남겨 보세요"
          submitLabel="등록"
          onSubmit={handleCreate}
        />
      </div>

      <Modal
        open={isDeleteOpen}
        onRequestClose={() => setIsDeleteOpen(false)}
        labelledBy="delete-comment-title"
        size="sm"
      >
        <div className="py-4 text-center">
          <img
            draggable={false}
            src={MASCOTS.surprised}
            alt=""
            className="mx-auto h-20 object-contain [image-rendering:pixelated]"
          />
          <h2 id="delete-comment-title" className="mt-6 text-head-03 font-bold text-text-strong">
            {deleteTarget?.parentId === null ? '댓글을 삭제할까요?' : '답글을 삭제할까요?'}
          </h2>
          <p className="mt-2 text-body-04 text-text-muted">
            {deleteTarget && deleteTarget.replyCount > 0
              ? '달린 답글도 함께 삭제돼요.'
              : '삭제하면 되돌릴 수 없어요.'}
          </p>
          {deleteError && <p className="mt-3 text-body-04 text-red-600">{deleteError}</p>}
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint hover:text-text-strong"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-red-500 py-3 text-body-04 font-bold text-white transition-colors hover:bg-red-600 disabled:bg-red-300"
            >
              {deleteMutation.isPending ? '삭제하는 중' : '삭제하기'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
