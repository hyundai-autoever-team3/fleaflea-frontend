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

// 일반 댓글 하나와 그 아래 답글들. 답글 버튼을 누르면 답글 목록과 입력 칸을 함께 펼친다.
// 답글은 한 칸 들여 쓰고, 구분선도 들여 쓴 자리에서 시작해 어느 댓글에 달린 것인지 보이게 한다
export function CommentThread({ comment, onDelete }: CommentThreadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const createMutation = useCreateItemComment(comment.itemId)
  const repliesQuery = useItemComments(comment.itemId, {
    parentId: comment.commentId,
    enabled: isOpen && comment.replyCount > 0,
  })
  const replies = repliesQuery.data?.pages.flatMap((page) => page.content) ?? []

  async function handleReply(content: string) {
    try {
      await createMutation.mutateAsync({ content, parentId: comment.commentId })
      return undefined
    } catch (error) {
      return getItemCommentErrorMessage(
        error,
        '답글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  return (
    <li>
      <CommentItem
        comment={comment}
        onDelete={onDelete}
        extraAction={
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
          >
            {isOpen ? '답글 접기' : comment.replyCount > 0 ? `답글 ${comment.replyCount}` : '답글'}
          </button>
        }
      />

      {isOpen && (
        <div className="ml-6 md:ml-10">
          {comment.replyCount > 0 &&
            (repliesQuery.isError ? (
              <p className="border-t border-primary-subtle py-4 text-body-04 text-text-muted">
                답글을 불러오지 못했어요.
              </p>
            ) : repliesQuery.isPending ? (
              <p className="border-t border-primary-subtle py-4 text-body-04 text-text-muted">
                답글을 불러오는 중이에요...
              </p>
            ) : (
              <ul>
                {replies.map((reply) => (
                  <li key={reply.commentId} className="border-t border-primary-subtle">
                    <CommentItem comment={reply} onDelete={onDelete} />
                  </li>
                ))}
              </ul>
            ))}

          {repliesQuery.hasNextPage && (
            <button
              type="button"
              onClick={() => void repliesQuery.fetchNextPage()}
              disabled={repliesQuery.isFetchingNextPage}
              className="block w-full border-t border-primary-subtle py-3 text-left text-xs font-bold text-text-muted transition-colors hover:text-text-strong disabled:opacity-60"
            >
              {repliesQuery.isFetchingNextPage ? '불러오는 중' : '답글 더 보기'}
            </button>
          )}

          <div className="border-t border-primary-subtle py-4">
            <CommentForm
              placeholder={`${comment.nickname}님에게 답글 남기기`}
              submitLabel="등록"
              onSubmit={handleReply}
              onCancel={() => setIsOpen(false)}
              autoFocus
            />
          </div>
        </div>
      )}
    </li>
  )
}
