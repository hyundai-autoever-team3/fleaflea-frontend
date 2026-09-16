import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

import { useMarket } from '../../../entities/market'
import {
  formatProductPrice,
  getRequestActionLabel,
  getStatusTagLabel,
  productKeys,
  useMarketProducts,
  useProduct,
} from '../../../entities/product'
import { useMyProfile } from '../../../entities/user'
import { deleteProduct, getDeleteProductErrorMessage } from '../../../features/product-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 403) return '이 상품이 등록된 마켓에 참여해야 볼 수 있어요.'
  if (status === 404) return '상품을 찾을 수 없어요.'
  return '상품 정보를 불러오지 못했어요.'
}

export function ProductDetailPage() {
  const { itemId: itemIdParam } = useParams()
  const itemId = Number(itemIdParam)
  const isValidId = Number.isInteger(itemId) && itemId > 0

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const productQuery = useProduct(itemId)
  const meQuery = useMyProfile()
  const product = productQuery.data

  const marketQuery = useMarket(product?.marketId ?? 0)
  // 상세 응답에는 사진 주소가 없고 저장 키만 있어서, 목록 응답의 imageUrl을 사용
  const productsQuery = useMarketProducts(product?.marketId ?? 0)
  const imageUrl = productsQuery.data?.find((item) => item.itemId === itemId)?.imageUrl ?? null

  const isOwner = product !== undefined && product.seller.id === meQuery.data?.memberId
  const isClosed = product !== undefined && product.status !== 'AVAILABLE'

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDelete() {
    if (!product) return
    setIsDeleting(true)
    setDeleteError('')
    try {
      await deleteProduct(product.itemId)
      void queryClient.invalidateQueries({ queryKey: productKeys.market(product.marketId) })
      useToastStore.getState().showToast('상품을 삭제했어요')
      navigate(`/market/${product.marketId}`, { replace: true, viewTransition: true })
    } catch (error) {
      setDeleteError(getDeleteProductErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        {!isValidId || productQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(productQuery.error) : '상품을 찾을 수 없어요.'}
            </p>
            <Link to="/market" className="mt-4 text-body-04 font-bold text-primary underline">
              내 마켓으로
            </Link>
          </div>
        ) : !product ? (
          <p className="py-24 text-center text-body-03 text-text-muted">상품을 불러오는 중이에요...</p>
        ) : (
          <>
            <Link
              to={`/market/${product.marketId}`}
              viewTransition
              className="text-body-04 text-text-muted hover:text-text-strong"
            >
              ← {marketQuery.data?.title ?? '마켓'}
            </Link>
            {/* 제목 줄 오른쪽에 주인용 동작 — 마켓 상세와 같은 자리 */}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-head-02 font-bold text-text-strong">상품 상세</h1>
                <p className="mt-1 text-body-04 text-text-muted">
                  {marketQuery.data?.title ?? '마켓'}
                  <span className="px-1">›</span>
                  {product.title}
                </p>
              </div>
              {isOwner && (
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/items/${product.itemId}/edit`}
                    viewTransition
                    style={{ clipPath: pixelBox(2) }}
                    className="flex h-9 items-center bg-primary px-3 text-xs font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                  >
                    정보 수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(true)}
                    style={{ clipPath: pixelBox(2) }}
                    className="flex h-9 items-center bg-primary-subtle px-3 text-xs font-bold text-text-muted transition-colors duration-200 hover:bg-red-100 hover:text-red-600"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* 사진 + 정보를 한 카드로 묶음. 사진 칸은 최대 360px, 남는 폭은 정보 칸이 사용 */}
            <div style={{ clipPath: pixelBox(6) }} className="mt-6 bg-bg p-4 md:p-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              {/* 사진 */}
              <div style={{ clipPath: pixelBox(4) }} className="bg-primary-subtle p-2">
                <div
                  style={{ clipPath: pixelBox(4) }}
                  className="relative flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className={`size-full object-cover ${isClosed ? 'blur-sm' : ''}`} />
                  ) : (
                    <img src={MASCOTS.default} alt="" className="h-28 object-contain [image-rendering:pixelated]" />
                  )}
                  {isClosed && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-head-03 font-bold text-white">
                      {getStatusTagLabel(product.status, product.tradeType)}
                    </span>
                  )}
                </div>
              </div>

              {/* 정보 */}
              <div className="flex flex-col py-2 md:py-4">
                <span
                  style={{ clipPath: pixelBox(2) }}
                  className="w-fit bg-primary-subtle px-2 py-1 text-xs font-bold text-text-muted"
                >
                  {getStatusTagLabel(product.status, product.tradeType)}
                </span>
                <h2 className="mt-3 text-head-03 font-bold text-text-strong">{product.title}</h2>
                <p className="mt-2 text-body-02 font-bold text-primary">{formatProductPrice(product)}</p>

                {/* 판매자 */}
                <div className="mt-6 flex items-center gap-2">
                  <img
                    src={product.seller.profileImageUrl || MASCOTS.default}
                    alt=""
                    style={{ clipPath: pixelBox(2) }}
                    className="size-8 bg-primary-subtle object-cover"
                  />
                  <span className="text-body-04 text-text-muted">
                    <span className="font-bold text-text-strong">{product.seller.nickname}</span>
                    {isOwner && ' (나)'}
                  </span>
                </div>

                <div className="mt-8">
                  {isOwner ? (
                    <p className="text-body-04 text-text-muted">내가 올린 상품이에요. 위에서 수정하거나 삭제할 수 있어요.</p>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled
                        style={{ clipPath: pixelBox(4) }}
                        className="h-12 w-full bg-primary text-body-04 font-bold text-white disabled:bg-primary/50"
                      >
                        {isClosed ? '거래가 끝난 상품이에요' : getRequestActionLabel(product.tradeType)}
                      </button>
                      {!isClosed && (
                        <p className="mt-2 text-center text-body-04 text-text-muted">거래 요청 기능은 준비 중이에요.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            </div>

            {/* 설명 */}
            <div style={{ clipPath: pixelBox(6) }} className="mt-6 bg-bg p-6 md:p-8">
              <h3 className="text-body-02 font-bold text-text-strong">이 물건을 소개해요</h3>
              <p className="mt-3 whitespace-pre-wrap text-body-03 text-text-muted">
                {product.description || '소개글이 없어요'}
              </p>
              <p className="mt-6 text-body-04 text-text-muted">
                예약 중이거나 거래가 끝난 상품은 상태 태그가 표시되고 새 요청을 받을 수 없어요.
              </p>
            </div>
          </>
        )}
      </div>

      {/* 삭제 확인 */}
      <Modal open={isDeleteOpen} onRequestClose={() => setIsDeleteOpen(false)} labelledBy="delete-product-title">
        <div className="text-center">
          <img src={MASCOTS.surprised} alt="" className="mx-auto h-16 object-contain [image-rendering:pixelated]" />
          <h2 id="delete-product-title" className="mt-4 text-body-02 font-bold text-text-strong">
            이 상품을 삭제할까요?
          </h2>
          <p className="mt-1 text-body-04 text-text-muted">삭제하면 되돌릴 수 없어요.</p>
          {deleteError && <p className="mt-3 text-body-04 text-red-600">{deleteError}</p>}
          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-red-500 py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:bg-red-300"
            >
              {isDeleting ? '삭제하는 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
