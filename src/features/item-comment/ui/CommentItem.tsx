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
  // 답글은 한 단계 안쪽이라 아바타를 작게 둔다
  avatarSize?: 'sm' | 'md'
  // 본문 아래, 같은 열에 이어 붙일 내용(답글 버튼과 답글 목록)
  children?: ReactNode
}

// 왼쪽에 아바타, 오른쪽 한 열에 닉네임·시간·본문을 쌓는다
export function CommentItem({ comment, onDelete, avatarSize = 'md', children }: CommentItemProps) {
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
    <div className="flex gap-3">
      {/* 댓글 응답에는 프로필 사진이 없어 모두 기본 얼굴로 보여 준다 */}
      <Avatar profileImageUrl={null} size={avatarSize} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-body-03 font-bold text-text-strong">
            {comment.nickname}
          </span>
          {comment.seller && (
            <span
              style={{ clipPath: pixelBox(2) }}
              className="shrink-0 bg-primary-subtle px-1.5 py-0.5 text-[11px] font-bold text-primary"
            >
              판매자
            </span>
          )}
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
          <time dateTime={comment.createdAt} title={formatFullDateTime(comment.createdAt)}>
            {formatRelativeTime(comment.createdAt)}
          </time>
          {comment.mine && !isEditing && (
            <>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="transition-colors hover:text-text-strong"
              >
                수정
              </button>
              <span aria-hidden>·</span>
              <button
                type="button"
                onClick={() => onDelete(comment)}
                className="transition-colors hover:text-red-600"
              >
                삭제
              </button>
            </>
          )}
        </p>

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
          <p className="mt-3 whitespace-pre-wrap break-words text-body-03 leading-relaxed text-text-strong">
            {comment.content}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
