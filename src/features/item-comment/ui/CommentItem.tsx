import { useState } from 'react'

import type { ItemComment } from '../../../entities/item-comment'
import { formatFullDateTime, formatRelativeTime } from '../../../shared/lib/date'
import { pixelBox } from '../../../shared/lib/pixel'
import { getItemCommentErrorMessage, useUpdateItemComment } from '../api/item-comment-api'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  comment: ItemComment
  onDelete: (comment: ItemComment) => void
  // 일반 댓글에만 답글 버튼을 둔다. 대댓글에는 다시 답글을 달 수 없다
  onReply?: () => void
}

const actionClass = 'text-xs font-bold text-text-muted transition-colors'

export function CommentItem({ comment, onDelete, onReply }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateMutation = useUpdateItemComment(comment.itemId)

  async function handleUpdate(content: string) {
    try {
      await updateMutation.mutateAsync({ commentId: comment.commentId, content })
      setIsEditing(false)
      return undefined
    } catch (error) {
      return getItemCommentErrorMessage(
        error,
        '댓글을 고치지 못했어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-body-04 font-bold text-text-strong">
          {comment.nickname}
          {comment.mine && <span className="font-normal text-text-muted"> (나)</span>}
        </span>
        {comment.seller && (
          <span
            style={{ clipPath: pixelBox(2) }}
            className="bg-primary-subtle px-1.5 py-0.5 text-[11px] font-bold text-primary"
          >
            판매자
          </span>
        )}
        <time
          dateTime={comment.createdAt}
          title={formatFullDateTime(comment.createdAt)}
          className="text-xs text-text-muted"
        >
          {formatRelativeTime(comment.createdAt)}
        </time>
      </div>

      {isEditing ? (
        <div className="mt-2">
          <CommentForm
            initialValue={comment.content}
            placeholder="댓글 수정"
            submitLabel="저장"
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            autoFocus
          />
        </div>
      ) : (
        <>
          <p className="mt-1 whitespace-pre-wrap break-words text-body-04 leading-relaxed text-text-strong">
            {comment.content}
          </p>

          {(onReply || comment.mine) && (
            <div className="mt-1.5 flex gap-3">
              {onReply && (
                <button
                  type="button"
                  onClick={onReply}
                  className={`${actionClass} hover:text-text-strong`}
                >
                  답글 달기
                </button>
              )}
              {comment.mine && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className={`${actionClass} hover:text-text-strong`}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(comment)}
                    className={`${actionClass} hover:text-red-600`}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
