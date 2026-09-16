import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { useMarket } from '../../../entities/market'
import { productKeys } from '../../../entities/product'
import { createProduct, getCreateProductErrorMessage, ProductForm } from '../../../features/product-manage'
import type { CreateProductPayload } from '../../../features/product-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { useToastStore } from '../../../shared/ui/toast'

export function ProductCreatePage() {
  const { marketId: marketIdParam } = useParams()
  const marketId = Number(marketIdParam)
  const isValidId = Number.isInteger(marketId) && marketId > 0

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const marketQuery = useMarket(marketId)

  async function handleSubmit(payload: CreateProductPayload) {
    await createProduct(marketId, payload)
    void queryClient.invalidateQueries({ queryKey: productKeys.market(marketId) })
    useToastStore.getState().showToast('상품을 등록했어요')
    navigate(`/market/${marketId}`, { replace: true, viewTransition: true })
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Link to={isValidId ? `/market/${marketId}` : '/market'} viewTransition className="text-body-04 text-text-muted hover:text-text-strong">
          ← {marketQuery.data?.title ?? '마켓'}
        </Link>
        <h1 className="mt-3 text-head-02 font-bold text-text-strong">상품 등록</h1>
        <p className="mt-1 text-body-03 text-text-muted">마켓 참여자들에게 보여줄 상품을 올려보세요.</p>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">참여 중인 마켓에서만 상품을 등록할 수 있어요.</p>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-8 md:p-10">
              <ProductForm
                submitLabel="상품 등록하기"
                submittingLabel="상품 등록하는 중..."
                onSubmit={handleSubmit}
                toErrorMessage={getCreateProductErrorMessage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
