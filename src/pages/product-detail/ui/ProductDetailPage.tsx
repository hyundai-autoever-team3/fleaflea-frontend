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
import { ProductTradeRequestModal } from '../../../features/trade-request'
import { MASCOTS } from '../../../shared/config/mascots'
import { useBackTarget, type BackTarget } from '../../../shared/lib/back-target'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { Modal } from '../../../shared/ui/modal'
import { PolaroidPhoto } from '../../../shared/ui/polaroid'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

function getDetailErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined
  if (status === 403) return '이 상품이 등록된 마켓에 참여해야 볼 수 있어요.'
  if (status === 404) return '상품을 찾을 수 없어요.'
  return '상품 정보를 불러오지 못했어요.'
}

// 돌아갈 곳은 들어온 경로에 따라 달라진다 (마켓 / 마이페이지 거래 목록)
function BackLink({ fallback }: { fallback: BackTarget }) {
  const back = useBackTarget(fallback)
  return (
    <Link to={back.to} viewTransition className="text-body-04 text-text-muted hover:text-text-strong">
      ← {back.label}
    </Link>
  )
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

  // 상품 상세 응답에는 내가 이미 요청했는지가 없다. 목록 API(GET /item-trade-requests)는
  // 마이페이지용이라 여기서는 쓰지 않고, 중복 요청은 서버의 409 응답으로 알린다
  const [isRequestOpen, setIsRequestOpen] = useState(false)

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
    // 폴라로이드 흰 테두리는 뒷배경이 유색일 때만 테두리로 읽힌다.
    // 페이지 기본 배경이 #fff라, 이 화면만 옅은 회색을 깔아 흰 면들이 드러나게 한다
    <div className="min-h-screen bg-bg">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        {!isValidId || productQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">
              {isValidId ? getDetailErrorMessage(productQuery.error) : '상품을 찾을 수 없어요.'}
            </p>
            <Link to="/market" className="mt-4 text-body-04 font-bold text-primary underline">
              내 마켓으로
            </Link>
          </div>
        ) : !product ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">상품을 불러오는 중이에요...</p>
        ) : (
          <>
            <BackLink fallback={{ to: `/market/${product.marketId}`, label: marketQuery.data?.title ?? '마켓' }} />
            <h1 className="mt-3 text-head-02 font-bold text-text-strong">상품 상세</h1>
            <p className="mt-1 text-body-04 text-text-muted">
              {marketQuery.data?.title ?? '마켓'}
              <span className="px-1">›</span>
              {product.title}
            </p>

            <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              {/* 사진 — 폴라로이드. 액자와 사진 칸 모두 픽셀 계단 모서리. 액자는 기울이지 않는다 */}
              <PolaroidPhoto
                imageUrl={imageUrl}
                statusLabel={isClosed ? getStatusTagLabel(product.status, product.tradeType) : undefined}
              />

              {/* 정보 */}
              <div className="flex flex-col py-2 md:py-4">
                {/* 상태 태그 줄 오른쪽에 주인용 동작 배치 */}
                <div className="flex items-center justify-between gap-3">
                  <span
                    style={{ clipPath: pixelBox(2) }}
                    className="w-fit bg-primary-subtle px-2 py-1 text-xs font-bold text-text-muted"
                  >
                    {getStatusTagLabel(product.status, product.tradeType)}
                  </span>
                  {isOwner && (
                    <div className="flex shrink-0 gap-2">
                      <Link
                        to={`/items/${product.itemId}/edit`}
                        viewTransition
                        style={{ clipPath: pixelBox(2) }}
                        className="flex h-7 items-center bg-primary px-2.5 text-[11px] font-bold text-white transition-colors duration-200 hover:bg-primary/90"
                      >
                        정보 수정
                      </Link>
                      <button
                        type="button"
                        onClick={() => setIsDeleteOpen(true)}
                        style={{ clipPath: pixelBox(2) }}
                        className="flex h-7 items-center bg-primary-subtle px-2.5 text-[11px] font-bold text-text-muted transition-colors duration-200 hover:bg-red-100 hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                <h2 className="mt-3 text-head-03 font-bold text-text-strong">{product.title}</h2>
                <p className="mt-2 text-body-02 font-bold text-primary">{formatProductPrice(product)}</p>

                {/* 판매자 */}
                <div className="mt-6 flex items-center gap-2">
                  <Avatar profileImageUrl={product.seller.profileImageUrl} size="sm" />
                  <span className="text-body-04 text-text-muted">
                    <span className="font-bold text-text-strong">{product.seller.nickname}</span>
                    {isOwner && ' (나)'}
                  </span>
                </div>

                {/* 소개 — 판매자 줄 바로 아래라, 꼬리를 위로 둔 말풍선으로 "판매자가 하는 말"처럼 읽히게 한다 */}
                <div className="relative mt-6 drop-shadow-[0_3px_5px_rgba(0,0,0,0.07)]">
                  {/* 꼬리는 말풍선의 clip-path 바깥에 둔다 — 안에 넣으면 잘린다.
                      계단 모양으로 그려 픽셀 톤을 맞춤 (스프라이트와 같은 crispEdges) */}
                  <svg
                    viewBox="0 0 12 8"
                    shapeRendering="crispEdges"
                    fill="var(--color-primary-subtle)"
                    aria-hidden
                    className="absolute -top-2 left-6 w-3"
                  >
                    <rect x="4" y="0" width="4" height="2" />
                    <rect x="2" y="2" width="8" height="2" />
                    <rect x="0" y="4" width="12" height="4" />
                  </svg>
                  <div style={{ clipPath: pixelBox(4) }} className="bg-primary-subtle p-3">
                    <h3 className="text-body-03 font-bold text-text-strong">이 물건을 소개해요</h3>
                    <p className="mt-2 whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted">
                      {product.description || '소개글이 없어요'}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  {!isOwner && (
                    <>
                      {/* 거래가 끝난 상품에는 요청을 보낼 수 없다 */}
                      <button
                        type="button"
                        disabled={isClosed}
                        onClick={() => setIsRequestOpen(true)}
                        style={{ clipPath: pixelBox(4) }}
                        className="h-11 w-full max-w-[260px] bg-primary text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90 disabled:bg-primary/50"
                      >
                        {isClosed ? '거래가 끝난 상품이에요' : getRequestActionLabel(product.tradeType)}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </>
        )}
      </div>

      {/* 삭제 확인 */}
      <Modal open={isDeleteOpen} onRequestClose={() => setIsDeleteOpen(false)} labelledBy="delete-product-title">
        <div className="py-8 text-center">
          <img src={MASCOTS.surprised} alt="" className="mx-auto h-28 object-contain [image-rendering:pixelated]" />
          <h2 id="delete-product-title" className="mt-6 text-head-03 font-bold text-text-strong">
            이 상품을 삭제할까요?
          </h2>
          <p className="mt-2 text-body-03 text-text-muted">삭제하면 되돌릴 수 없어요.</p>
          {deleteError && <p className="mt-3 text-body-04 text-red-200">{deleteError}</p>}
          <div className="mt-10 flex gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-primary-subtle py-4 text-body-03 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              style={{ clipPath: pixelBox(4) }}
              className="flex-1 bg-red-500 py-4 text-body-03 font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:bg-red-300"
            >
              {isDeleting ? '삭제하는 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 거래 요청 — 내 상품에는 열 일이 없어 주인일 때는 두지 않는다 */}
      {product && !isOwner && (
        <ProductTradeRequestModal
          open={isRequestOpen}
          itemId={product.itemId}
          itemTitle={product.title}
          tradeType={product.tradeType}
          onClose={() => setIsRequestOpen(false)}
        />
      )}
    </div>
  )
}
