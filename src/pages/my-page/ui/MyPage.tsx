import { useRef, useState } from 'react'
import { Link } from 'react-router'

import { useMyProfile } from '../../../entities/user'
import {
  AccountSettingsModal,
  PasswordChangeModal,
  ProfileEditModal,
  WithdrawModal,
} from '../../../features/profile-manage'
import { MASCOTS } from '../../../shared/config/mascots'
import { pixelBox } from '../../../shared/lib/pixel'
import { GLYPHS, Sprite } from '../../../shared/ui/sprite'
import { Avatar } from '../../../shared/ui/avatar'
import { Header } from '../../../widgets/header'
import { MyTradeList } from '../../../widgets/my-trade-list'

type OpenModal = 'profile' | 'account' | 'password' | 'withdraw' | null

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-text-strong'
const SHORTCUTS = [
  { to: '/item-dex', label: '내 물건 도감', glyph: GLYPHS.book },
  { to: '/friends', label: '내 친구', glyph: GLYPHS.friends },
]

// 글리프를 연보라 판에 얹은 작은 액자. 줄마다 같은 크기로 서서 목록이 가지런해진다
function GlyphTile({ rows }: { rows: readonly string[] }) {
  return (
    <span
      style={{ clipPath: pixelBox(2) }}
      className="grid size-8 shrink-0 place-items-center bg-primary-subtle text-primary transition-colors group-hover:bg-bg"
    >
      <Sprite rows={rows} className="w-3.5" />
    </span>
  )
}

export function MyPage() {
  const profileQuery = useMyProfile()
  const [openModal, setOpenModal] = useState<OpenModal>(null)
  const accountSettingsButtonRef = useRef<HTMLButtonElement>(null)
  const profile = profileQuery.data

  function closeAccountSettingsFlow() {
    setOpenModal(null)
    requestAnimationFrame(() => accountSettingsButtonRef.current?.focus())
  }

  return (
    <div className="min-h-dvh bg-primary-subtle/30">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-6 py-8 md:px-14 lg:px-24">
        <h1 className="text-head-02 font-bold text-text-strong">마이페이지</h1>
        <p className="mt-2 text-body-04 leading-relaxed text-text-muted">나의 물건, 이웃과의 거래를 한곳에서 관리해요.</p>

        {profileQuery.isPending ? (
          <div role="status" aria-label="내 정보를 불러오는 중이에요" className="mt-8 grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
            <span className="sr-only">내 정보를 불러오는 중이에요...</span>
            {[0, 1].map((index) => (
              <div key={index} aria-hidden="true" style={{ clipPath: pixelBox(6) }} className="bg-primary-tint/60 p-[2px]">
                <div style={{ clipPath: pixelBox(6) }} className="min-h-80 bg-bg p-6 motion-safe:animate-pulse">
                  <div className="h-16 w-16 bg-primary-subtle" />
                  <div className="mt-6 h-5 w-2/3 bg-primary-subtle" />
                  <div className="mt-3 h-4 w-1/2 bg-primary-subtle" />
                  <div className="mt-8 h-12 bg-primary-subtle" />
                </div>
              </div>
            ))}
          </div>
        ) : profileQuery.isError || !profile ? (
          <div style={{ clipPath: pixelBox(6) }} className="mt-8 bg-primary-tint p-[2px]">
            <div style={{ clipPath: pixelBox(6) }} className="flex flex-col items-center bg-bg px-6 py-20 text-center">
              <img src={MASCOTS.surprised} alt="" className="h-24 object-contain [image-rendering:pixelated]" />
              <p role="alert" className="mt-5 text-body-02 font-bold text-text-strong">내 정보를 불러오지 못했어요</p>
              <p className="mt-2 text-body-04 text-text-muted">잠시 후 다시 시도해 주세요.</p>
              <button
                type="button"
                onClick={() => void profileQuery.refetch()}
                disabled={profileQuery.isFetching}
                style={{ clipPath: pixelBox(3) }}
                className={`mt-6 min-h-11 bg-primary-tint px-5 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary disabled:opacity-50 ${FOCUS_RING}`}
              >
                {profileQuery.isFetching ? '다시 불러오는 중...' : '다시 시도'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
              <section aria-labelledby="my-profile-title" style={{ clipPath: pixelBox(6) }} className="min-w-0 bg-primary-tint p-[2px]">
                <div style={{ clipPath: pixelBox(6) }} className="bg-bg">
                  <div className="p-4 sm:p-5">
                    <h2 id="my-profile-title" className="text-body-04 font-bold text-text-muted">내 프로필</h2>
                    <div className="mt-4 flex items-center gap-4 lg:flex-col lg:items-start">
                      <span style={{ clipPath: pixelBox(4) }} className="shrink-0 bg-primary-tint p-[3px]">
                        <Avatar profileImageUrl={profile.profileImageUrl} size="lg" />
                      </span>
                      <div className="min-w-0 flex-1 lg:w-full">
                        <p className="break-words text-body-02 font-bold leading-relaxed text-text-strong">{profile.nickname}</p>
                        <p className="mt-1 break-all text-body-04 leading-relaxed text-text-muted">{profile.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenModal('profile')}
                      style={{ clipPath: pixelBox(3) }}
                      className={`mt-4 flex min-h-11 w-full items-center justify-center bg-primary-tint px-4 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary ${FOCUS_RING}`}
                    >
                      프로필 수정
                    </button>

                    <nav aria-label="내 활동 바로가기" className="mt-4 grid grid-cols-2 gap-1 border-t border-primary-subtle pt-3 lg:grid-cols-1">
                      {SHORTCUTS.map(({ to, label, glyph }) => (
                        <Link
                          key={to}
                          to={to}
                          viewTransition
                          style={{ clipPath: pixelBox(2) }}
                          className={`group flex min-h-12 items-center gap-2.5 px-2 transition-colors hover:bg-primary-subtle ${FOCUS_RING}`}
                        >
                          <GlyphTile rows={glyph} />
                          <span className="min-w-0 flex-1 truncate text-body-04 font-bold text-text-strong">{label}</span>
                          <Sprite rows={GLYPHS.arrowRight} className="hidden w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5 lg:block" />
                        </Link>
                      ))}
                      <button
                        ref={accountSettingsButtonRef}
                        type="button"
                        onClick={() => setOpenModal('account')}
                        aria-haspopup="dialog"
                        style={{ clipPath: pixelBox(2) }}
                        className={`group col-span-full flex min-h-12 items-center gap-2.5 px-2 text-left transition-colors hover:bg-primary-subtle ${FOCUS_RING}`}
                      >
                        <GlyphTile rows={GLYPHS.gear} />
                        <span className="min-w-0 flex-1 text-body-04 font-bold text-text-strong">계정 설정</span>
                        <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </section>

              <div className="min-w-0">
                <MyTradeList />
              </div>
            </div>
          </>
        )}
      </main>

      {openModal === 'profile' && profile && (
        <ProfileEditModal profile={profile} onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'account' && (
        <AccountSettingsModal
          onClose={closeAccountSettingsFlow}
          onPasswordChange={() => setOpenModal('password')}
          onWithdraw={() => setOpenModal('withdraw')}
        />
      )}
      {openModal === 'password' && <PasswordChangeModal onClose={closeAccountSettingsFlow} />}
      {openModal === 'withdraw' && <WithdrawModal onClose={closeAccountSettingsFlow} />}
    </div>
  )
}
