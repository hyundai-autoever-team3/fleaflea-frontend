import { useParams } from 'react-router'

import { getTradeRequestDetailErrorMessage, useTradeRequestDetail } from '../../../entities/trade'
import type { TradeRequestDetail, TradeRequestKind } from '../../../entities/trade'
import { useMyProfile } from '../../../entities/user'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { BackLink } from '../../../shared/ui/back-link'
import { Photo } from '../../../shared/ui/photo'
import { PolaroidPhoto } from '../../../shared/ui/polaroid'
import { Header } from '../../../widgets/header'

const KINDS = ['ITEM', 'COLLECTION', 'BEG'] as const

function toKind(value: string | undefined): TradeRequestKind | null {
  return KINDS.find((kind) => kind === value?.toUpperCase()) ?? null
}

const KIND_LABEL: Record<TradeRequestKind, string> = {
  ITEM: '마켓 상품',
  COLLECTION: '도감 거래',
  BEG: '구걸',
}

const STATUS_LABEL: Record<TradeRequestDetail['status'], string> = {
  PENDING: '기다리는 중',
  ACCEPTED: '수락됨',
  REJECTED: '거절됨',
  CANCELLED: '취소됨',
  COMPLETED: '거래 완료',
}

// 대여의 수락·완료 상태는 일반 거래와 구분해 표시한다.
function statusLabel({ status, tradeType }: TradeRequestDetail) {
  if (tradeType === 'RENTAL') {
    if (status === 'ACCEPTED') return '대여 중'
    if (status === 'COMPLETED') return '대여 완료'
  }

  return STATUS_LABEL[status]
}

// 상품·도감 거래의 공통 라벨이다. 거래 방식이 없는 구걸은 KIND_LABEL을 사용한다.
const TRADE_TYPE_LABEL: Record<string, string> = {
  SALE: '판매',
  GIVEAWAY: '나눔',
  RENTAL: '대여',
  EXCHANGE: '교환',
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  const pad = (part: number) => String(part).padStart(2, '0')

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

function formatPrice({ tradeType, price }: Pick<TradeRequestDetail, 'tradeType' | 'price'>) {
  if (tradeType === 'GIVEAWAY') return '무료 나눔'
  if (price === null) return null

  return `${price.toLocaleString('ko-KR')}원`
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null

  return (
    <div className="flex gap-3 py-2">
      <dt className="w-20 shrink-0 text-body-04 text-text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-body-04 font-bold text-text-strong">{value}</dd>
    </div>
  )
}

export function TradeRequestDetailPage() {
  const { requestType: typeParam, requestId: idParam } = useParams()
  const requestType = toKind(typeParam)
  const requestId = Number(idParam)

  const meQuery = useMyProfile()
  const detailQuery = useTradeRequestDetail(requestType, requestId)
  const detail = detailQuery.data

  // 요청을 보낸 쪽인지에 따라 거래 상대와 제안 물건의 소유자 문구를 결정한다.
  const isRequester = detail !== undefined && detail.requester.memberId === meQuery.data?.memberId
  const counterparty = detail === undefined ? null : isRequester ? detail.owner : detail.requester

  const rentalPeriod =
    detail?.rentalStartDate && detail.rentalEndDate
      ? `${formatDate(detail.rentalStartDate)} ~ ${formatDate(detail.rentalEndDate)}`
      : null

  return (
    <div className="min-h-dvh bg-bg">
      <Header />

      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        <BackLink fallback={{ to: '/my-page', label: '마이페이지' }} />

        {requestType === null || detailQuery.isError ? (
          <div className="flex flex-col items-center py-16 text-center lg:py-24">
            <img
              draggable={false}
              src={MASCOTS.surprised}
              alt=""
              className="h-24 object-contain [image-rendering:pixelated]"
            />
            <p className="mt-4 text-body-03 text-text-muted">
              {requestType === null
                ? '알 수 없는 거래 종류예요.'
                : getTradeRequestDetailErrorMessage(detailQuery.error)}
            </p>
          </div>
        ) : !detail ? (
          <p className="py-16 text-center text-body-03 text-text-muted lg:py-24">
            거래 내역을 불러오는 중이에요...
          </p>
        ) : (
          <>
            <h1 className="mt-3 text-head-02 font-bold text-text-strong">거래 내역</h1>
            <p className="mt-1 text-body-04 text-text-muted">
              {KIND_LABEL[detail.requestType]}
              <span className="px-1">›</span>
              {detail.targetItemTitle}
            </p>

            <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <PolaroidPhoto imageUrl={detail.targetItemImageUrl} />

              <div className="flex flex-col py-2 md:py-4">
                <span
                  style={{ clipPath: pixelBox(2) }}
                  className="w-fit bg-primary-subtle px-2 py-1 text-xs font-bold text-primary"
                >
                  {detail.tradeType
                    ? (TRADE_TYPE_LABEL[detail.tradeType] ?? detail.tradeType)
                    : KIND_LABEL[detail.requestType]}
                </span>

                <h2 className="mt-3 text-head-03 font-bold text-text-strong">
                  {detail.targetItemTitle}
                </h2>
                {formatPrice(detail) && (
                  <p className="mt-2 text-body-02 font-bold text-primary">{formatPrice(detail)}</p>
                )}
                {detail.targetItemDescription && (
                  <p className="mt-3 whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted">
                    {detail.targetItemDescription}
                  </p>
                )}

                {counterparty && (
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar profileImageUrl={counterparty.profileImageUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-body-03 font-bold text-text-strong">
                        {counterparty.nickname}
                      </p>
                      <p className="text-body-04 text-text-muted">
                        {isRequester ? '이 물건의 주인이에요' : '나에게 요청한 사람이에요'}
                      </p>
                    </div>
                  </div>
                )}

                {/* 현재 물건 정보와 별도로, 요청 당시의 기간과 처리 상태를 표시한다. */}
                <dl className="mt-6 divide-y divide-primary-subtle border-y border-primary-subtle">
                  <InfoRow label="상태" value={statusLabel(detail)} />
                  <InfoRow label="대여 기간" value={rentalPeriod} />
                  <InfoRow label="요청한 날" value={formatDate(detail.createdAt)} />
                  <InfoRow
                    label="완료한 날"
                    value={detail.completedAt ? formatDate(detail.completedAt) : null}
                  />
                </dl>

                {detail.message && (
                  <div style={{ clipPath: pixelBox(3) }} className="mt-6 bg-primary-subtle p-4">
                    <p className="text-body-04 font-bold text-text-strong">요청하며 남긴 말</p>
                    <p className="mt-1 whitespace-pre-wrap text-body-04 leading-relaxed text-text-muted">
                      {detail.message}
                    </p>
                  </div>
                )}

                {/* 교환·구걸에서 요청자가 대신 내놓은 물건 */}
                {detail.offerItem && (
                  <div className="mt-6">
                    <p className="text-body-04 font-bold text-text-strong">
                      {isRequester ? '내가 내놓은 물건' : '상대가 내놓은 물건'}
                    </p>
                    <div
                      style={{ clipPath: pixelBox(3) }}
                      className="mt-2 flex items-center gap-3 bg-primary-subtle p-3"
                    >
                      <span
                        style={{ clipPath: pixelBox(2) }}
                        className="grid size-16 shrink-0 place-items-center overflow-hidden bg-bg"
                      >
                        <Photo
                          src={detail.offerItem.imageUrl}
                          fallback={MASCOTS.default}
                          className="size-full object-cover"
                          fallbackClassName="h-2/3"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-body-03 font-bold text-text-strong">
                          {detail.offerItem.title}
                        </p>
                        {detail.offerItem.description && (
                          <p className="mt-0.5 line-clamp-2 text-body-04 text-text-muted">
                            {detail.offerItem.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
