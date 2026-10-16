import { useState } from 'react'
import type { ReactNode } from 'react'

import type { ItemComment } from '../../../entities/item-comment'
import { formatFullDateTime, formatRelativeTime } from '../../../shared/lib/date'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { getItemCommentErrorMessage, useUpdateItemComment } from '../api/item-comment-api'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  comment: ItemComment
  onDelete: (comment: ItemComment) => void
  // 오른쪽 아래 동작 줄 맨 끝에 붙일 버튼(일반 댓글의 답글 버튼)
  extraAction?: ReactNode
}

const actionClass = 'text-xs text-text-muted transition-colors hover:text-text-strong'

// 윗줄에 아바타·닉네임과 오른쪽 끝 시간, 그 아래 본문, 오른쪽 아래에 동작을 둔다
export function CommentItem({ comment, onDelete, extraAction }: CommentItemProps) {
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
    <div className="py-4">
      <div className="flex items-center gap-2">
        {/* 댓글 응답에는 프로필 사진이 없어 모두 기본 얼굴로 보여 준다 */}
        <Avatar profileImageUrl={null} size="sm" />
        <span className="truncate text-body-04 font-bold text-text-strong">{comment.nickname}</span>
        {comment.seller && (
          <span
            style={{ clipPath: pixelBox(2) }}
            className="shrink-0 bg-primary-subtle px-1.5 py-0.5 text-[11px] font-bold text-primary"
          >
            판매자
          </span>
        )}
        <time
          dateTime={comment.createdAt}
          title={formatFullDateTime(comment.createdAt)}
          className="ml-auto shrink-0 text-xs text-text-muted"
        >
          {formatRelativeTime(comment.createdAt)}
        </time>
      </div>

      {isEditing ? (
        <div className="mt-3">
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
          <p className="mt-2 whitespace-pre-wrap break-words text-body-04 leading-relaxed text-text-strong">
            {comment.content}
          </p>

          {(comment.mine || extraAction) && (
            <div className="mt-2 flex justify-end gap-3">
              {comment.mine && (
                <>
                  <button type="button" onClick={() => setIsEditing(true)} className={actionClass}>
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(comment)}
                    className="text-xs text-text-muted transition-colors hover:text-red-600"
                  >
                    삭제
                  </button>
                </>
              )}
              {extraAction}
            </div>
          )}
        </>
      )}
    </div>
  )
}
