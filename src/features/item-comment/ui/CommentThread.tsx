import { useState } from 'react'

import type { ItemComment } from '../../../entities/item-comment'
import { useItemComments } from '../../../entities/item-comment'
import { getItemCommentErrorMessage, useCreateItemComment } from '../api/item-comment-api'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'

interface CommentThreadProps {
  comment: ItemComment
  onDelete: (comment: ItemComment) => void
}

// 일반 댓글 하나와 그 아래 답글들. 답글은 펼칠 때 따로 받는다
export function CommentThread({ comment, onDelete }: CommentThreadProps) {
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [replyFormOpen, setReplyFormOpen] = useState(false)
  const createMutation = useCreateItemComment(comment.itemId)
  const repliesQuery = useItemComments(comment.itemId, {
    parentId: comment.commentId,
    enabled: repliesOpen,
  })
  const replies = repliesQuery.data?.pages.flatMap((page) => page.content) ?? []

  async function handleReply(content: string) {
    try {
      await createMutation.mutateAsync({ content, parentId: comment.commentId })
      setReplyFormOpen(false)
      // 방금 쓴 답글이 보이도록 펼친다
      setRepliesOpen(true)
      return undefined
    } catch (error) {
      return getItemCommentErrorMessage(
        error,
        '답글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  return (
    <li className="py-4">
      <CommentItem
        comment={comment}
        onDelete={onDelete}
        onReply={() => setReplyFormOpen((open) => !open)}
      />

      {comment.replyCount > 0 && (
        <button
          type="button"
          onClick={() => setRepliesOpen((open) => !open)}
          aria-expanded={repliesOpen}
          className="mt-2 text-xs font-bold text-primary transition-colors hover:text-primary/80"
        >
          {repliesOpen ? '답글 숨기기' : `답글 ${comment.replyCount}개`}
        </button>
      )}

      {repliesOpen && comment.replyCount > 0 && (
        <div className="mt-2 border-l-2 border-primary-subtle pl-4">
          {repliesQuery.isError ? (
            <p className="py-2 text-body-04 text-text-muted">답글을 불러오지 못했어요.</p>
          ) : repliesQuery.isPending ? (
            <p className="py-2 text-body-04 text-text-muted">답글을 불러오는 중이에요...</p>
          ) : (
            <ul>
              {replies.map((reply) => (
                <li key={reply.commentId} className="py-2">
                  <CommentItem comment={reply} onDelete={onDelete} />
                </li>
              ))}
            </ul>
          )}

          {repliesQuery.hasNextPage && (
            <button
              type="button"
              onClick={() => void repliesQuery.fetchNextPage()}
              disabled={repliesQuery.isFetchingNextPage}
              className="py-1 text-xs font-bold text-text-muted transition-colors hover:text-text-strong disabled:opacity-60"
            >
              {repliesQuery.isFetchingNextPage ? '불러오는 중' : '답글 더 보기'}
            </button>
          )}
        </div>
      )}

      {replyFormOpen && (
        <div className="mt-3 border-l-2 border-primary-subtle pl-4">
          <CommentForm
            placeholder={`${comment.nickname}님에게 답글 남기기`}
            submitLabel="등록"
            onSubmit={handleReply}
            onCancel={() => setReplyFormOpen(false)}
            autoFocus
          />
        </div>
      )}
    </li>
  )
}
