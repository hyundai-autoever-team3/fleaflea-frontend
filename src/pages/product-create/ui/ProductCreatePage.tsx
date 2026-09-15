import { Link, useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { useMarket } from '../../../entities/market'
import { productKeys } from '../../../entities/product'
import { CreateProductForm } from '../../../features/product-manage'
import { pixelBox } from '../../../shared/lib/pixel'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

export function ProductCreatePage() {
  const { marketId: marketIdParam } = useParams()
  const marketId = Number(marketIdParam)
  const isValidId = Number.isInteger(marketId) && marketId > 0

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const marketQuery = useMarket(marketId)

  function handleCreated() {
    void queryClient.invalidateQueries({ queryKey: productKeys.market(marketId) })
    useToastStore.getState().showToast('상품을 등록했어요')
    navigate(`/market/${marketId}`, { replace: true })
  }

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
        <Link to={isValidId ? `/market/${marketId}` : '/market'} className="text-body-04 text-text-muted hover:text-text-strong">
          ← {marketQuery.data?.title ?? '마켓'}
        </Link>
        <h1 className="mt-3 text-head-02 font-bold text-text-strong">상품 등록</h1>
        <p className="mt-1 text-body-03 text-text-muted">마켓 참여자들에게 보여줄 상품을 올려보세요.</p>

        {!isValidId || marketQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src="/mascot/flea4.png" alt="" className="h-24 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">참여 중인 마켓에서만 상품을 등록할 수 있어요.</p>
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
            <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-8 md:p-10">
              <CreateProductForm marketId={marketId} onCreated={handleCreated} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
