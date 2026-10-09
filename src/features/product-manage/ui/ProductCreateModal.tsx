import { useState } from 'react'
import { useNavigate } from 'react-router'

import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { useToastStore } from '../../../shared/ui/toast'
import { getCreateProductErrorMessage, useCreateProduct } from '../api/product-api'
import type { CreateProductPayload } from '../api/product-api'
import { ProductForm } from './ProductForm'

interface ProductCreateModalProps {
  marketId: number
  open: boolean
  onClose: () => void
}

// 마켓 화면을 벗어나지 않고 상품을 올리는 모달. 넓은 화면의 웹에서만 쓰고,
// 설치한 앱과 좁은 화면은 폼이 길어 기존 등록 페이지(/market/:id/items/new)로 간다.
export function ProductCreateModal({ marketId, open, onClose }: ProductCreateModalProps) {
  const navigate = useNavigate()
  const createMutation = useCreateProduct(marketId)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)

  function close() {
    setIsFormDirty(false)
    setIsConfirmingClose(false)
    onClose()
  }

  // 바깥 클릭·ESC·X로 닫으려 할 때, 적어 둔 내용이 있으면 한 번 더 묻는다
  function requestClose() {
    if (createMutation.isPending) return

    if (isFormDirty) setIsConfirmingClose(true)
    else close()
  }

  async function handleSubmit(payload: CreateProductPayload) {
    const product = await createMutation.mutateAsync(payload)

    // 등록은 성공했지만 도감 사진이 누락된 경우, 중복 등록 대신 수정 화면으로 이동한다.
    if (payload.collectionItemId !== undefined && !payload.image && !product.imageUrl) {
      useToastStore
        .getState()
        .showToast(
          '상품은 등록했지만 사진이 반영되지 않았어요. 수정 화면에서 사진을 확인해 주세요.',
        )
      close()
      navigate(`/items/${product.itemId}/edit`, { viewTransition: true })
      return
    }

    useToastStore.getState().showToast('상품을 등록했어요')
    close()
  }

  return (
    <Modal open={open} onRequestClose={requestClose} labelledBy="product-create-title">
      <h2 id="product-create-title" className="text-head-03 font-bold text-text-strong">
        상품 등록
      </h2>
      <p className="mt-1 text-body-04 text-text-muted">
        마켓 참여자들에게 보여줄 상품을 올려보세요.
      </p>

      <div className="mt-6">
        <ProductForm
          allowCollectionImport
          submitLabel="상품 등록하기"
          submittingLabel="상품 등록하는 중..."
          onSubmit={handleSubmit}
          onDirtyChange={setIsFormDirty}
          toErrorMessage={getCreateProductErrorMessage}
        />
      </div>

      {/* 확인을 취소해도 입력값이 유지되도록 폼을 마운트한 채 덮는다. */}
      {isConfirmingClose && (
        <div
          // transform이 적용된 dialog를 기준으로 덮도록 absolute를 사용한다.
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-6"
          onClick={() => setIsConfirmingClose(false)}
        >
          <div
            role="alertdialog"
            aria-labelledby="product-close-confirm-title"
            onClick={(event) => event.stopPropagation()}
            style={{ clipPath: pixelBox(6) }}
            className="w-[min(360px,100%)] bg-bg p-7 text-center"
          >
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="mx-auto h-16 object-contain [image-rendering:pixelated]"
            />
            <p
              id="product-close-confirm-title"
              className="mt-4 text-body-02 font-bold text-text-strong"
            >
              작성 중인 내용이 사라져요
            </p>
            <p className="mt-1 text-body-04 text-text-muted">
              지금 닫으면 입력한 내용이 저장되지 않아요.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmingClose(false)}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
              >
                계속 작성
              </button>
              <button
                type="button"
                onClick={close}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
