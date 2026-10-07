import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'

import {
  useCollectionItem,
  useMyCollectionItems,
  type CollectionItemDetail,
  type CollectionItemSummary,
} from '../../../entities/collection-item'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Modal } from '../../../shared/ui/modal'

// 미리보기 개수와 전체 보기에서 추가로 렌더링할 개수를 구분한다.
const PREVIEW_COUNT = 4
const SCROLL_STEP = 12

interface CollectionPickerModalProps {
  currentItemId?: number
  replacesContent: boolean
  onApply: (item: CollectionItemDetail) => void
  onClose: () => void
}

export function CollectionPhoto({
  imageUrl,
  className = '',
}: {
  imageUrl: string | null
  className?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  return imageUrl && imageUrl !== failedUrl ? (
    <img
      draggable={false}
      src={imageUrl}
      alt=""
      onError={() => setFailedUrl(imageUrl)}
      className={`size-full object-cover ${className}`}
    />
  ) : (
    <span className={`flex size-full items-center justify-center bg-primary-subtle ${className}`}>
      <img
        draggable={false}
        src={MASCOTS.default}
        alt=""
        className="h-1/2 object-contain [image-rendering:pixelated]"
      />
    </span>
  )
}

// 미리보기와 전체 보기에서 선택·비공개 상태를 동일하게 표시한다.
function ItemCard({
  item,
  selected,
  onSelect,
}: {
  item: CollectionItemSummary
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li className="min-w-0">
      <button
        type="button"
        disabled={!item.isPublic}
        onClick={onSelect}
        aria-pressed={selected}
        title={item.isPublic ? item.title : `${item.title} — 비공개라 불러올 수 없어요`}
        aria-label={item.isPublic ? item.title : `${item.title}, 비공개라 고를 수 없음`}
        className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span
          style={{ clipPath: pixelBox(3) }}
          className={`block p-[3px] transition-colors ${selected ? 'bg-primary' : 'bg-primary-subtle hover:bg-primary-tint'} ${item.isPublic ? '' : 'hover:bg-primary-subtle'}`}
        >
          <span
            style={{ clipPath: pixelBox(3) }}
            className="relative block aspect-square overflow-hidden bg-primary-subtle"
          >
            <CollectionPhoto imageUrl={item.imageUrl} />
            {selected && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary py-1 text-center text-xs font-bold text-white">
                선택됨
              </span>
            )}
            {/* 선택할 수 없는 이유를 카드에 표시한다. */}
            {!item.isPublic && (
              <span className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-center text-xs font-bold text-white">
                비공개
              </span>
            )}
          </span>
        </span>
        <span className="mt-2 block truncate text-body-04 font-bold text-text-strong">
          {item.title}
        </span>
      </button>
    </li>
  )
}

export function CollectionPickerModal({
  currentItemId,
  replacesContent,
  onApply,
  onClose,
}: CollectionPickerModalProps) {
  const titleId = useId()
  const [selectedId, setSelectedId] = useState<number | null>(currentItemId ?? null)
  // 전체 보기에서 선택하면 미리보기 화면으로 돌아온다.
  const [viewingAll, setViewingAll] = useState(false)
  const [visibleCount, setVisibleCount] = useState(SCROLL_STEP)
  const scrollRef = useRef<HTMLUListElement>(null)
  const sentinelRef = useRef<HTMLLIElement>(null)
  const itemsQuery = useMyCollectionItems()
  const detailQuery = useCollectionItem(selectedId ?? 0)
  const items = itemsQuery.data ?? []
  // 비공개 물건도 목록에 표시하지만 선택 가능한 개수에서는 제외한다.
  const importableCount = items.filter((item) => item.isPublic).length
  // 선택 이후 삭제되거나 비공개로 전환된 물건인지 최신 목록에서 확인한다.
  const selectedSummary = items.find((item) => item.collectionItemId === selectedId)
  // 선택 ID와 일치하는 상세 캐시만 사용하고, 재조회 중에도 기존 내용을 유지한다.
  const selectedItem =
    detailQuery.data?.collectionItemId === selectedId ? detailQuery.data : undefined
  const canApply = Boolean(selectedSummary?.isPublic && selectedItem?.isPublic)
  const hasMoreToRender = visibleCount < items.length

  // 전체 목록은 이미 조회했으므로 스크롤 시 렌더링할 항목 수만 늘린다.
  useEffect(() => {
    if (!viewingAll || !hasMoreToRender) return

    const sentinel = sentinelRef.current
    const root = scrollRef.current
    if (!sentinel || !root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setVisibleCount((count) => Math.min(count + SCROLL_STEP, items.length))
      },
      { root, rootMargin: '160px' },
    )
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [viewingAll, hasMoreToRender, items.length])

  function openAll() {
    setVisibleCount(SCROLL_STEP)
    setViewingAll(true)
  }

  if (viewingAll) {
    return (
      <Modal open onRequestClose={onClose} labelledBy={titleId} size="lg">
        <h2 id={titleId} className="pr-5 text-head-03 font-bold text-text-strong">
          내 물건 전체
        </h2>
        <p className="mt-2 text-body-04 text-text-muted">사진을 누르면 그 물건으로 골라요.</p>
        <ul
          ref={scrollRef}
          className="mt-5 grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain p-1 sm:grid-cols-4"
        >
          {items.slice(0, visibleCount).map((item) => (
            <ItemCard
              key={item.collectionItemId}
              item={item}
              selected={item.collectionItemId === selectedId}
              onSelect={() => {
                setSelectedId(item.collectionItemId)
                setViewingAll(false)
              }}
            />
          ))}
          {hasMoreToRender && (
            <li ref={sentinelRef} aria-hidden="true" className="col-span-full h-1" />
          )}
        </ul>
        <p aria-live="polite" className="mt-3 text-center text-body-04 text-text-muted">
          {hasMoreToRender
            ? '아래로 내리면 더 보여드려요'
            : `내 물건 ${items.length}개를 모두 봤어요`}
        </p>
        <button
          type="button"
          onClick={() => setViewingAll(false)}
          style={{ clipPath: pixelBox(4) }}
          className="mt-5 min-h-12 w-full bg-primary-subtle px-3 py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint"
        >
          돌아가기
        </button>
      </Modal>
    )
  }

  return (
    <Modal open onRequestClose={onClose} labelledBy={titleId} size="lg">
      <h2 id={titleId} className="pr-5 text-head-03 font-bold text-text-strong">
        내 도감에서 불러오기
      </h2>
      <p className="mt-2 text-body-04 text-text-muted">상품으로 올릴 물건을 하나 골라 주세요.</p>

      {itemsQuery.isPending ? (
        <p role="status" className="py-14 text-center text-body-03 text-text-muted">
          내 도감을 불러오는 중이에요...
        </p>
      ) : itemsQuery.isError ? (
        <div className="py-10 text-center">
          <p role="alert" className="text-body-03 text-text-muted">
            내 도감을 불러오지 못했어요.
          </p>
          <button
            type="button"
            onClick={() => void itemsQuery.refetch()}
            disabled={itemsQuery.isFetching}
            className="mt-3 min-h-11 text-body-04 font-bold text-primary underline disabled:opacity-50"
          >
            {itemsQuery.isFetching ? '다시 불러오는 중...' : '다시 시도'}
          </button>
        </div>
      ) : importableCount === 0 ? (
        // 빈 도감과 모두 비공개인 도감은 사용자가 취할 수 있는 조치가 다르다.
        <div className="flex flex-col items-center py-10 text-center">
          <img
            draggable={false}
            src={MASCOTS.basket}
            alt=""
            className="h-20 object-contain [image-rendering:pixelated]"
          />
          <p className="mt-4 text-body-03 font-bold text-text-strong">
            {items.length === 0 ? '아직 도감에 물건이 없어요' : '불러올 수 있는 물건이 없어요'}
          </p>
          <p className="mt-1 text-body-04 text-text-muted">
            {items.length === 0
              ? '돌아가서 상품 정보를 직접 입력할 수 있어요.'
              : '비공개 물건은 상품으로 올릴 수 없어요. 도감에서 공개로 바꿔 주세요.'}
          </p>
          {items.length > 0 && (
            <Link
              to="/item-dex"
              viewTransition
              style={{ clipPath: pixelBox(4) }}
              className="mt-5 bg-primary px-5 py-2.5 text-body-04 font-bold text-white hover:bg-primary/90"
            >
              내 도감으로 가기
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-body-04 font-bold text-text-strong">
              내 물건 <span className="text-primary">{importableCount}</span>
            </p>
            {items.length > PREVIEW_COUNT && (
              <button
                type="button"
                onClick={openAll}
                className="min-h-11 shrink-0 text-xs text-text-muted transition-colors hover:text-text-strong"
              >
                전체 상품보기
              </button>
            )}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-3 p-1 sm:grid-cols-4">
            {items.slice(0, PREVIEW_COUNT).map((item) => (
              <ItemCard
                key={item.collectionItemId}
                item={item}
                selected={item.collectionItemId === selectedId}
                onSelect={() => setSelectedId(item.collectionItemId)}
              />
            ))}
          </ul>

          {/* 이름은 목록에서 바로 표시하고, 상세 설명 로딩 중에도 미리보기 높이를 유지한다. */}
          <div
            aria-live="polite"
            style={{ clipPath: pixelBox(4) }}
            className="mt-5 bg-primary-subtle p-4"
          >
            <p
              className={`truncate text-body-03 font-bold ${selectedSummary ? 'text-text-strong' : 'text-text-muted'}`}
            >
              {selectedSummary?.title ?? '아직 고른 물건이 없어요'}
            </p>
            <div className="mt-1 min-h-[2.625rem] text-body-04 text-text-muted">
              {selectedSummary === undefined ? (
                <p>고른 물건의 이름·설명·사진을 가져와요.</p>
              ) : !selectedSummary.isPublic ? (
                <p>비공개 물건은 상품으로 올릴 수 없어요. 다른 물건을 골라 주세요.</p>
              ) : detailQuery.isError ? (
                <>
                  <p>물건 정보를 가져오지 못했어요. 삭제됐거나 접근할 수 없는 물건일 수 있어요.</p>
                  <button
                    type="button"
                    onClick={() => void detailQuery.refetch()}
                    disabled={detailQuery.isFetching}
                    className="mt-2 min-h-11 font-bold text-primary underline disabled:opacity-50"
                  >
                    다시 시도
                  </button>
                </>
              ) : selectedItem === undefined ? (
                <p>설명을 확인하는 중이에요...</p>
              ) : (
                <p className="line-clamp-2 whitespace-pre-line">
                  {selectedItem.description?.trim() ||
                    '등록된 설명이 없어요. 불러온 뒤 상품 설명을 적어 주세요.'}
                </p>
              )}
            </div>
          </div>
          {replacesContent && (
            <p className="mt-3 text-body-04 text-text-muted">
              불러오면 작성 중인 이름·설명·사진이 바뀌어요. 가격과 거래 유형은 유지돼요.
            </p>
          )}
        </>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={!canApply}
          onClick={() => {
            if (canApply && selectedItem) onApply(selectedItem)
          }}
          style={{ clipPath: pixelBox(4) }}
          className="min-h-12 flex-1 bg-primary px-3 py-3 text-body-04 font-bold text-white transition-colors hover:bg-primary/90 disabled:bg-primary/50"
        >
          불러오기
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ clipPath: pixelBox(4) }}
          className="min-h-12 flex-1 bg-primary-subtle px-3 py-3 text-body-04 font-bold text-text-muted transition-colors hover:bg-primary-tint"
        >
          취소
        </button>
      </div>
    </Modal>
  )
}
