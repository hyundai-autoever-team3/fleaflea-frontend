// GET /api/v1/items/{itemId}/comments 응답 (ItemCommentResponse)
export interface ItemComment {
  commentId: number
  itemId: number
  // 일반 댓글은 null, 대댓글은 부모 댓글 ID
  parentId: number | null
  authorId: number
  // 탈퇴한 회원은 서버가 '탈퇴한 회원'으로 내려 준다
  nickname: string
  // 상품 판매자가 쓴 댓글인지
  seller: boolean
  // 지금 보는 사람이 쓴 댓글인지
  mine: boolean
  content: string
  // 대댓글 수. 대댓글에서는 항상 0
  replyCount: number
  createdAt: string
}
