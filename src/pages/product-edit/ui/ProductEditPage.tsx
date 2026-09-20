import { Link, useNavigate, useParams } from 'react-router'

import { useMarketProducts, useProduct } from '../../../entities/product'
import { useMyProfile } from '../../../entities/user'
import { getUpdateProductErrorMessage, ProductForm, useUpdateProduct } from '../../../features/product-manage'
import type { CreateProductPayload } from '../../../features/product-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

export function ProductEditPage() {
  const { itemId: itemIdParam } = useParams()
  const itemId = Number(itemIdParam)
  const isValidId = Number.isInteger(itemId) && itemId > 0

  const navigate = useNavigate()
  const productQuery = useProduct(itemId)
  const meQuery = useMyProfile()
  const product = productQuery.data

  // 상세 응답에는 사진 주소가 없어서 목록 응답의 imageUrl을 초기값으로 사용
  const productsQuery = useMarketProducts(product?.marketId ?? 0)
  const imageUrl = productsQuery.data?.find((item) => item.itemId === itemId)?.imageUrl ?? null

  const isOwner = product !== undefined && product.seller.id === meQuery.data?.memberId
  // 상세를 받기 전에는 마켓을 몰라 0으로 두지만, 폼은 상품이 있어야 보이므로 그때만 쓰인다
  const updateMutation = useUpdateProduct(itemId, product?.marketId ?? 0)

  async function handleSubmit(payload: CreateProductPayload) {
    if (!product) return
    // 목록·상세 새로고침은 useUpdateProduct 안에서 한다
    await updateMutation.mutateAsync(payload)
    useToastStore.getState().showToast('상품 정보를 수정했어요')
    navigate(`/items/${product.itemId}`, { replace: true, viewTransition: true })
  }

  return (
    <div>
      <Header />
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        <Link
          to={isValidId ? `/items/${itemId}` : '/market'}
          viewTransition
          className="text-body-04 text-text-muted hover:text-text-strong"
        >
          ← {product?.title ?? '상품'}
        </Link>
        <h1 className="mt-3 text-head-02 font-bold text-text-strong">상품 정보 수정</h1>
        <p className="mt-1 text-body-03 text-text-muted">바꾸고 싶은 내용을 고쳐 주세요.</p>

        {!isValidId || productQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">상품을 찾을 수 없어요.</p>
          </div>
        ) : !product ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">상품을 불러오는 중이에요...</p>
        ) : !isOwner ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">내가 올린 상품만 수정할 수 있어요.</p>
            <Link to={`/items/${itemId}`} className="mt-4 text-body-04 font-bold text-primary underline">
              상품 상세로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-8 md:p-10">
              <ProductForm
                initialValue={{
                  title: product.title,
                  description: product.description ?? '',
                  tradeType: product.tradeType,
                  price: product.price,
                  imageUrl,
                }}
                submitLabel="수정 내용 저장하기"
                submittingLabel="저장하는 중..."
                onSubmit={handleSubmit}
                toErrorMessage={getUpdateProductErrorMessage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
