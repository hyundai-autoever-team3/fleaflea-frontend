import { useState } from 'react'

import {
  CollectionSlot,
  EmptySlot,
  useCollectionItem,
  useMyCollectionItems,
} from '../../../entities/collection-item'
import {
  CollectionForm,
  getCreateCollectionErrorMessage,
  getDeleteCollectionErrorMessage,
  getUpdateCollectionErrorMessage,
  useCreateCollectionItem,
  useDeleteCollectionItem,
  useUpdateCollectionItem,
} from '../../../features/collection-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'
import { Photo } from '../../../shared/ui/photo'
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

type ModalKind = 'create' | 'edit' | null

// 데스크톱의 4열 × 3행에 맞춘 슬롯 수이다.
const SLOTS_PER_PAGE = 12

function SummaryLine({ total }: { total: number }) {
  return <p className="mt-1 text-body-04 text-text-muted">내 물건 {total}개</p>
}

export function ItemDexPage() {
  const itemsQuery = useMyCollectionItems()
  const items = itemsQuery.data ?? []

  // 훅에서 전체 목록을 받아 화면 단위로 페이지를 나눈다.
  const [page, setPage] = useState(0)

  // 등록용 빈 슬롯을 항상 남긴다. 12개라면 빈 페이지를 포함해 총 2페이지이다.
  const pageCount = Math.floor(items.length / SLOTS_PER_PAGE) + 1

  // 삭제로 현재 페이지가 사라지면 마지막 페이지로 보정한다.
  if (page > pageCount - 1) setPage(pageCount - 1)

  const pageItems = items.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE)

  const [modal, setModal] = useState<ModalKind>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // 목록 응답에 없는 설명은 선택한 물건의 상세 조회로 가져온다.
  const detailQuery = useCollectionItem(selectedId ?? 0)
  const detail = detailQuery.data

  const createMutation = useCreateCollectionItem()
  const updateMutation = useUpdateCollectionItem(selectedId ?? 0)
  const deleteMutation = useDeleteCollectionItem(selectedId ?? 0)

  function closeFormModal() {
    setModal(null)
    setIsFormDirty(false)
    setIsConfirmingClose(false)
  }

  function requestCloseFormModal() {
    if (isFormDirty) {
      setIsConfirmingClose(true)
      return
    }

    closeFormModal()
  }

  async function handleDelete() {
    setDeleteError('')

    try {
      await deleteMutation.mutateAsync()

      useToastStore.getState().showToast('물건을 삭제했어요')
      setIsDeleteOpen(false)
      setSelectedId(null)
    } catch (error) {
      setDeleteError(getDeleteCollectionErrorMessage(error))
    }
  }

  return (
    <div>
      <Header />

      <div className="mx-auto w-full max-w-7xl px-3 pb-5 pt-5 sm:px-6 sm:pb-8 sm:pt-12 md:px-14 lg:px-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-head-03 font-bold text-text-strong sm:text-head-02">물건 도감</h1>
            {!itemsQuery.isPending && !itemsQuery.isError && <SummaryLine total={items.length} />}
          </div>
          {/* 빈 도감에서는 아래의 첫 물건 등록 버튼을 사용한다. */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setModal('create')}
              style={{ clipPath: pixelBox(4) }}
              className="flex h-10 items-center bg-primary px-4 text-body-04 font-bold text-white sm:h-11 sm:px-5 transition-colors duration-200 hover:bg-primary/90"
            >
              + 물건 등록
            </button>
          )}
        </div>

        {itemsQuery.isPending ? (
          <p className="py-16 lg:py-24 text-center text-body-03 text-text-muted">
            도감을 불러오는 중이에요...
          </p>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center py-16 lg:py-24 text-center">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="h-24 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-4 text-body-03 text-text-muted">도감을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => void itemsQuery.refetch()}
              style={{ clipPath: pixelBox() }}
              className="mt-4 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="relative mt-4 sm:mt-8">
            <div
              style={{ clipPath: pixelBox(6) }}
              className="bg-primary-tint p-1 drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)] sm:p-2"
            >
              <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-1.5 sm:p-3 md:p-4">
                <ul className="grid grid-cols-3 gap-1 sm:gap-3 lg:grid-cols-4">
                  {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => {
                    const item = pageItems[index]

                    return (
                      <li key={item?.collectionItemId ?? `empty-${page}-${index}`}>
                        {item ? (
                          <CollectionSlot
                            item={item}
                            onClick={() => setSelectedId(item.collectionItemId)}
                          />
                        ) : (
                          <EmptySlot onClick={() => setModal('create')} />
                        )}
                      </li>
                    )
                  })}
                </ul>

                {pageCount > 1 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5 border-t border-primary-subtle pt-3">
                    {Array.from({ length: pageCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setPage(index)}
                        aria-label={`${index + 1}페이지`}
                        aria-current={page === index ? 'page' : undefined}
                        style={{ clipPath: pixelBox(2) }}
                        className={
                          page === index
                            ? 'size-8 bg-primary text-body-04 font-bold text-white'
                            : 'size-8 bg-primary-subtle text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong'
                        }
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {items.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <img
                  draggable={false}
                  src={MASCOTS.basket}
                  alt=""
                  className="h-20 object-contain [image-rendering:pixelated]"
                />
                <p className="mt-3 text-body-03 font-bold text-text-strong">
                  아직 등록한 물건이 없어요
                </p>
                <p className="mt-1 text-body-04 text-text-muted">
                  아끼는 물건을 도감에 채워보세요!
                </p>
                <button
                  type="button"
                  onClick={() => setModal('create')}
                  style={{ clipPath: pixelBox(4) }}
                  className="mt-5 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
                >
                  + 첫 물건 등록하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={modal !== null}
        onRequestClose={requestCloseFormModal}
        labelledBy="collection-form-title"
      >
        <h2 id="collection-form-title" className="text-head-03 font-bold text-text-strong">
          {modal === 'edit' ? '물건 정보 수정' : '물건 등록'}
        </h2>
        <p className="mt-1 text-body-04 text-text-muted">도감에 담아둘 물건을 기록해요.</p>

        <div className="mt-6">
          <CollectionForm
            initialValue={
              modal === 'edit' && detail
                ? {
                    title: detail.title,
                    description: detail.description ?? '',
                    isPublic: detail.isPublic,
                    imageUrl: detail.imageUrl,
                  }
                : undefined
            }
            submitLabel={modal === 'edit' ? '수정하기' : '등록하기'}
            submittingLabel={modal === 'edit' ? '수정하는 중...' : '등록하는 중...'}
            toErrorMessage={
              modal === 'edit' ? getUpdateCollectionErrorMessage : getCreateCollectionErrorMessage
            }
            onDirtyChange={setIsFormDirty}
            onCancel={requestCloseFormModal}
            onSubmit={async (payload) => {
              if (modal === 'edit') {
                await updateMutation.mutateAsync(payload)
                useToastStore.getState().showToast('물건 정보를 수정했어요')
              } else {
                await createMutation.mutateAsync(payload)
                useToastStore.getState().showToast('물건을 등록했어요')
              }

              closeFormModal()
            }}
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
              aria-labelledby="collection-close-confirm-title"
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
                id="collection-close-confirm-title"
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
                  onClick={closeFormModal}
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

      <Modal
        open={selectedId !== null && modal === null}
        // 다른 물건을 열 때 삭제 확인과 이전 오류가 남지 않도록 함께 초기화한다.
        onRequestClose={() => {
          setSelectedId(null)
          setIsDeleteOpen(false)
          setDeleteError('')
        }}
        labelledBy="collection-detail-title"
        size="sm"
        showClose={false}
      >
        {detailQuery.isPending ? (
          <p className="py-10 text-center text-body-03 text-text-muted">불러오는 중이에요...</p>
        ) : detailQuery.isError || !detail ? (
          <div className="py-10 text-center">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="mx-auto h-20 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-4 text-body-03 text-text-muted">물건 정보를 불러오지 못했어요.</p>
          </div>
        ) : isDeleteOpen ? (
          // 상세 모달의 내용을 교체해 중첩 모달을 만들지 않는다.
          <div className="py-6 text-center">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="mx-auto h-20 object-contain [image-rendering:pixelated]"
            />
            <h2
              id="collection-detail-title"
              className="mt-6 text-head-03 font-bold text-text-strong"
            >
              물건을 삭제할까요?
            </h2>
            <p className="mt-2 text-body-04 text-text-muted">
              <span className="block font-bold text-text-strong">{detail.title}</span>
              도감에서 지워요. 되돌릴 수 없어요.
            </p>
            {deleteError && <p className="mt-3 text-body-04 text-red-600">{deleteError}</p>}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-red-500 py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-red-600 disabled:bg-red-300"
              >
                {deleteMutation.isPending ? '삭제하는 중...' : '삭제하기'}
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div
              style={{ clipPath: pixelBox(4) }}
              className="flex aspect-square items-center justify-center overflow-hidden bg-primary-subtle"
            >
              <Photo
                src={detail.imageUrl}
                fallback={MASCOTS.default}
                className="size-full object-cover"
                fallbackClassName="h-20"
              />
            </div>

            <span
              style={{ clipPath: pixelBox(2) }}
              className="mt-4 inline-block bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary"
            >
              {detail.isPublic ? '공개' : '비공개'}
            </span>
            <h2
              id="collection-detail-title"
              className="mt-2 text-body-02 font-bold text-text-strong"
            >
              {detail.title}
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted">
              {detail.description || '설명이 없어요'}
            </p>

            {deleteError && <p className="mt-3 text-body-04 text-red-600">{deleteError}</p>}

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setModal('edit')}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-primary py-3 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
              >
                정보 수정
              </button>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{ clipPath: pixelBox(4) }}
                className="flex-1 bg-primary-subtle py-3 text-body-04 font-bold text-text-muted transition-colors duration-200 hover:bg-primary-tint hover:text-text-strong"
              >
                닫기
              </button>
            </div>
            {detail.status === 'IN_PROGRESS' ? (
              <p className="mt-4 text-center text-body-04 text-text-muted">
                거래 중인 물건은 삭제할 수 없어요.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDeleteError('')
                  setIsDeleteOpen(true)
                }}
                className="mt-4 w-full text-body-04 font-bold text-text-muted underline transition-colors duration-200 hover:text-red-600"
              >
                도감에서 삭제
              </button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
