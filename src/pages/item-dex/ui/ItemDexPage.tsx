import { useState } from 'react'

import { CollectionSlot, EmptySlot, useCollectionItem, useMyCollectionItems } from '../../../entities/collection-item'
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
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'

// 한 페이지 안에서 모달로 처리. 카드가 링크가 아니라 onClick을 받는 설계를 따름
type ModalKind = 'create' | 'edit' | null

// 넓은 화면 4열 기준 3줄. 칸이 커서 한 화면에 이만큼만 두고 나머지는 페이지로 넘김
const SLOTS_PER_PAGE = 12

// 공개/비공개 개수는 서버가 주지 않아 전 페이지를 받아야만 셀 수 있어서 표시하지 않기로 함
function SummaryLine({ total }: { total: number }) {
  return <p className="mt-1 text-body-04 text-text-muted">내 물건 {total}개</p>
}

export function ItemDexPage() {
  const itemsQuery = useMyCollectionItems()
  const items = itemsQuery.data ?? []
  // 서버가 100개씩 주는 걸 전부 받아두고 화면에서 12칸씩 끊어 보여줌
  const [page, setPage] = useState(0)
  // 판이 가득 차면 등록할 빈 칸이 없어지므로, 여유 판을 늘 한 장 더 둔다.
  // (12개 → 2장, 24개 → 3장. 0개일 때는 1장)
  const pageCount = Math.floor(items.length / SLOTS_PER_PAGE) + 1
  // 삭제로 항목이 줄어 마지막 페이지가 사라지면 앞 페이지로 당김
  if (page > pageCount - 1) setPage(pageCount - 1)
  const pageItems = items.slice(page * SLOTS_PER_PAGE, (page + 1) * SLOTS_PER_PAGE)

  const [modal, setModal] = useState<ModalKind>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // 목록에는 설명이 없어 상세를 따로 받아옴
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
    // 작성 중이면 바로 닫지 않고 모달 안에서 확인
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

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-12 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-head-02 font-bold text-text-strong">물건 도감</h1>
            {!itemsQuery.isPending && !itemsQuery.isError && <SummaryLine total={items.length} />}
          </div>
          {/* 물건이 없을 때는 판 위의 "첫 물건 등록하기"가 그 역할을 하므로 숨김 (같은 동작 버튼 두 개 방지) */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setModal('create')}
              style={{ clipPath: pixelBox(4) }}
              className="flex h-11 items-center bg-primary px-5 text-body-04 font-bold text-white transition-colors duration-200 hover:bg-primary/90"
            >
              + 물건 등록
            </button>
          )}
        </div>

        {itemsQuery.isPending ? (
          <p className="py-24 text-center text-body-03 text-text-muted">도감을 불러오는 중이에요...</p>
        ) : itemsQuery.isError ? (
          <div className="flex flex-col items-center py-24 text-center">
            <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
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
          <div className="relative mt-8">
            {/* 인벤토리 판: 바깥 연보라 테두리 + 안쪽 흰 면 (픽셀 테두리 2겹).
                열을 적게 두어 칸을 키움 — 사진이 정사각으로 잘려 보이는 정도를 줄이기 위함 */}
            <div style={{ clipPath: pixelBox(6) }} className="bg-primary-tint p-2 drop-shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
              <div style={{ clipPath: pixelBox(6) }} className="bg-bg p-3 md:p-4">
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => {
                    const item = pageItems[index]
                    return (
                      <li key={item?.collectionItemId ?? `empty-${page}-${index}`}>
                        {item ? (
                          <CollectionSlot item={item} onClick={() => setSelectedId(item.collectionItemId)} />
                        ) : (
                          // 빈 칸을 눌러도 바로 등록할 수 있게
                          <EmptySlot onClick={() => setModal('create')} />
                        )}
                      </li>
                    )
                  })}
                </ul>

                {/* 페이지 번호는 판 안쪽에 둔다 — 인벤토리 창의 탭처럼 보이게.
                    12칸을 넘길 때만 나타남 */}
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

            {/* 물건이 없을 때는 빈 판 위에 겹쳐 안내. 빈 칸은 클릭 대상이 아니라 가려도 무방 */}
            {items.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                <img
                  src={MASCOTS.basket}
                  alt=""
                  className="h-20 object-contain [image-rendering:pixelated]"
                />
                <p className="mt-3 text-body-03 font-bold text-text-strong">아직 등록한 물건이 없어요</p>
                <p className="mt-1 text-body-04 text-text-muted">아끼는 물건을 도감에 채워보세요!</p>
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

      {/* 등록 · 수정 */}
      <Modal open={modal !== null} onRequestClose={requestCloseFormModal} labelledBy="collection-form-title">
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
            toErrorMessage={modal === 'edit' ? getUpdateCollectionErrorMessage : getCreateCollectionErrorMessage}
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

        {/* 작성 중 닫기 확인: 폼은 그대로 두고 위에만 덮어 입력 내용을 지키지 않게 함 */}
        {isConfirmingClose && (
          <div
            // dialog에 transform이 걸려 있어 fixed를 쓰면 뷰포트가 아니라 모달 상자를 기준으로 잡힌다.
            // 닫힐 때 모달이 축소되면 같이 찌그러지므로, 기준을 명시적으로 모달로 두는 absolute를 쓴다
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
              <img src={MASCOTS.surprised} alt="" className="mx-auto h-16 object-contain [image-rendering:pixelated]" />
              <p id="collection-close-confirm-title" className="mt-4 text-body-02 font-bold text-text-strong">
                작성 중인 내용이 사라져요
              </p>
              <p className="mt-1 text-body-04 text-text-muted">지금 닫으면 입력한 내용이 저장되지 않아요.</p>
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

      {/* 상세 */}
      <Modal
        open={selectedId !== null && modal === null}
        // 삭제 확인 화면에서 바깥을 눌러 닫으면 그 상태가 남아, 다음에 연 물건이 삭제 화면으로 뜬다
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
            <img src={MASCOTS.surprised} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
            <p className="mt-4 text-body-03 text-text-muted">물건 정보를 불러오지 못했어요.</p>
          </div>
        ) : isDeleteOpen ? (
          // 모달 위에 모달을 겹치지 않도록, 같은 모달 안에서 내용만 확인 화면으로 바꿈
          <div className="py-6 text-center">
            <img src={MASCOTS.surprised} alt="" className="mx-auto h-20 object-contain [image-rendering:pixelated]" />
            <h2 id="collection-detail-title" className="mt-6 text-head-03 font-bold text-text-strong">
              물건을 삭제할까요?
            </h2>
            {/* 이름을 줄로 떼어내 조사(을/를) 문제를 피함 */}
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
              {detail.imageUrl ? (
                <img src={detail.imageUrl} alt="" className="size-full object-cover" />
              ) : (
                <img src={MASCOTS.default} alt="" className="h-20 object-contain [image-rendering:pixelated]" />
              )}
            </div>

            <span
              style={{ clipPath: pixelBox(2) }}
              className="mt-4 inline-block bg-primary-subtle px-2 py-0.5 text-xs font-bold text-primary"
            >
              {detail.isPublic ? '공개' : '비공개'}
            </span>
            <h2 id="collection-detail-title" className="mt-2 text-body-02 font-bold text-text-strong">
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
          </div>
        )}
      </Modal>

    </div>
  )
}
