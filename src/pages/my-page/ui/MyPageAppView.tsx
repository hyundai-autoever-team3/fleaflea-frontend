import { useState } from 'react'
import { Link } from 'react-router'
import { PencilIcon } from '@heroicons/react/24/solid'

import { useMyCollectionItems } from '../../../entities/collection-item'
import type { CollectionItemSummary } from '../../../entities/collection-item'
import type { MyProfile } from '../../../entities/user'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { Avatar } from '../../../shared/ui/avatar'
import { MyTradeList } from '../../../widgets/my-trade-list'

// 미리 보기에는 최근 물건 몇 개만 둔다. 나머지는 '전체 보기'로 도감에서 본다
const DEX_PREVIEW_COUNT = 10

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-strong'

function DexPreviewItem({ item }: { item: CollectionItemSummary }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const imageUrl = item.imageUrl && item.imageUrl !== failedImageUrl ? item.imageUrl : null

  return (
    <li className="w-20 shrink-0 snap-start">
      <Link
        to={`/collection-items/${item.collectionItemId}`}
        viewTransition
        className={`block ${FOCUS_RING}`}
      >
        <span
          style={{ clipPath: pixelBox(3) }}
          className="grid aspect-square w-full place-items-center overflow-hidden bg-primary-subtle"
        >
          {imageUrl ? (
            <img
              draggable={false}
              src={imageUrl}
              alt=""
              loading="lazy"
              onError={() => setFailedImageUrl(imageUrl)}
              className="size-full object-cover"
            />
          ) : (
            <img
              draggable={false}
              src={MASCOTS.default}
              alt=""
              className="h-2/3 object-contain [image-rendering:pixelated]"
            />
          )}
        </span>
        <span className="mt-1.5 block truncate text-center text-xs text-text-muted">
          {item.title}
        </span>
      </Link>
    </li>
  )
}

interface MyPageAppViewProps {
  profile: MyProfile
  onEditProfile: () => void
  isLoggingOut: boolean
  onLogout: () => void
}

// 설치한 앱에서 보는 마이페이지 본문. 카드 안에 모아 두던 웹 배치 대신
// 프로필을 가운데에 두고, 그 아래로 도감 미리 보기와 거래 목록을 한 줄로 쌓는다.
export function MyPageAppView({
  profile,
  onEditProfile,
  isLoggingOut,
  onLogout,
}: MyPageAppViewProps) {
  const itemsQuery = useMyCollectionItems()
  const items = itemsQuery.data ?? []

  return (
    <>
      <section aria-label="내 프로필" className="mt-2 flex flex-col items-center text-center">
        <span style={{ clipPath: pixelBox(4) }} className="bg-primary-tint p-[3px]">
          <Avatar profileImageUrl={profile.profileImageUrl} size="lg" />
        </span>

        <div className="mt-3 flex max-w-full items-center gap-1.5">
          <p className="min-w-0 break-words text-body-01 font-bold text-text-strong">
            {profile.nickname}
          </p>
          <button
            type="button"
            onClick={onEditProfile}
            aria-label="프로필 수정"
            aria-haspopup="dialog"
            // 둥근 버튼 대신 다른 버튼들과 같은 계단 모서리를 쓴다
            style={{ clipPath: pixelBox(2) }}
            className={`grid size-8 shrink-0 place-items-center bg-primary-tint text-text-strong ${FOCUS_RING}`}
          >
            <PencilIcon className="size-4" />
          </button>
        </div>
        <p className="mt-0.5 break-all text-body-04 text-text-muted">{profile.email}</p>
      </section>

      <section aria-labelledby="my-dex-title" className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <h2 id="my-dex-title" className="text-body-02 font-bold text-text-strong">
            내 물건 도감
            {itemsQuery.data && <span className="ml-1 text-primary">{items.length}</span>}
          </h2>
          <Link
            to="/item-dex"
            viewTransition
            className={`flex min-h-9 items-center text-body-04 text-text-muted ${FOCUS_RING}`}
          >
            전체 보기
          </Link>
        </div>

        {itemsQuery.isPending ? (
          <p className="mt-3 text-body-04 text-text-muted">불러오는 중이에요...</p>
        ) : itemsQuery.isError ? (
          <p className="mt-3 text-body-04 text-text-muted">도감을 불러오지 못했어요.</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-body-04 text-text-muted">아직 도감에 담은 물건이 없어요.</p>
        ) : (
          // 화면 양끝까지 밀리도록 본문 여백(px-4)만큼 바깥으로 빼고 안쪽에 같은 여백을 다시 준다
          <ul className="-mx-4 mt-3 flex snap-x gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.slice(0, DEX_PREVIEW_COUNT).map((item) => (
              <DexPreviewItem key={item.collectionItemId} item={item} />
            ))}
          </ul>
        )}
      </section>

      <div className="mt-7 min-w-0">
        <MyTradeList />
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
        className={`mx-auto mt-6 flex min-h-11 items-center px-4 text-body-04 text-text-muted underline disabled:opacity-50 ${FOCUS_RING}`}
      >
        {isLoggingOut ? '로그아웃하는 중...' : '로그아웃'}
      </button>
    </>
  )
}
