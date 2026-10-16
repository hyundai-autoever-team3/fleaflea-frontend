import { useState } from 'react'
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

import type { ItemComment } from '../../../entities/item-comment'
import { useItemComments } from '../../../entities/item-comment'
import { getItemCommentErrorMessage, useCreateItemComment } from '../api/item-comment-api'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'

interface CommentThreadProps {
  comment: ItemComment
  onDelete: (comment: ItemComment) => void
}

// 일반 댓글 하나와 그 아래 답글들. 답글 버튼을 누르면 답글 목록과 입력 칸을 함께 펼친다
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
      <CommentItem comment={comment} onDelete={onDelete}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className={`mt-3 flex items-center gap-1 text-body-04 transition-colors hover:text-text-strong ${
            isOpen ? 'font-bold text-text-strong' : 'text-text-muted'
          }`}
        >
          <ChatBubbleLeftEllipsisIcon className="size-5" aria-hidden />
          {comment.replyCount > 0 ? `답글 ${comment.replyCount}` : '답글 쓰기'}
        </button>

        {isOpen && (
          <div className="mt-4 flex flex-col gap-5">
            {comment.replyCount > 0 &&
              (repliesQuery.isError ? (
                <p className="text-body-04 text-text-muted">답글을 불러오지 못했어요.</p>
              ) : repliesQuery.isPending ? (
                <p className="text-body-04 text-text-muted">답글을 불러오는 중이에요...</p>
              ) : (
                <ul className="flex flex-col gap-5">
                  {replies.map((reply) => (
                    <li key={reply.commentId}>
                      <CommentItem comment={reply} onDelete={onDelete} avatarSize="sm" />
                    </li>
                  ))}
                </ul>
              ))}

            {repliesQuery.hasNextPage && (
              <button
                type="button"
                onClick={() => void repliesQuery.fetchNextPage()}
                disabled={repliesQuery.isFetchingNextPage}
                className="w-fit text-xs font-bold text-text-muted transition-colors hover:text-text-strong disabled:opacity-60"
              >
                {repliesQuery.isFetchingNextPage ? '불러오는 중' : '답글 더 보기'}
              </button>
            )}

            <CommentForm
              placeholder={`${comment.nickname}님에게 답글 남기기`}
              submitLabel="등록"
              onSubmit={handleReply}
              onCancel={() => setIsOpen(false)}
              autoFocus
            />
          </div>
        )}
      </CommentItem>
    </li>
  )
}
