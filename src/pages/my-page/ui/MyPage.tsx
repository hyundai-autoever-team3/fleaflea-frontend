import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useSessionStore } from '../../../entities/session'
import { useMyProfile } from '../../../entities/user'
import { logout } from '../../../features/auth'
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
import { useToastStore } from '../../../shared/ui/toast'
import { Header } from '../../../widgets/header'
import { MyTradeList } from '../../../widgets/my-trade-list'

type OpenModal = 'profile' | 'account' | 'password' | 'withdraw' | null

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-text-strong'
const SHORTCUTS = [
  { to: '/item-dex', label: '내 물건 도감', description: '아끼는 물건을 모아두는 곳' },
  { to: '/friends', label: '내 친구', description: '함께 거래하는 친구들' },
]

export function MyPage() {
  const navigate = useNavigate()
  const profileQuery = useMyProfile()
  const [openModal, setOpenModal] = useState<OpenModal>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const accountSettingsButtonRef = useRef<HTMLButtonElement>(null)
  const profile = profileQuery.data

  function closeAccountSettingsFlow() {
    setOpenModal(null)
    requestAnimationFrame(() => accountSettingsButtonRef.current?.focus())
  }

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      // 서버의 refresh token을 지운다. 실패해도 이 기기에서는 로그아웃돼야 하므로 막지 않는다
      await logout()
    } catch {
      // 무시 — 아래에서 로컬 세션을 비운다
    }
    useSessionStore.getState().clearSession()
    useToastStore.getState().showToast('로그아웃했어요')
    void navigate('/login', { replace: true, viewTransition: true })
  }

  return (
    <div className="min-h-dvh bg-primary-subtle/30">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-5 pb-12 pt-8 sm:px-6 md:px-14 md:pb-16 md:pt-12 lg:px-16">
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
                  <div className="h-2 bg-primary-tint" />
                  <div className="p-5 sm:p-6">
                    <h2 id="my-profile-title" className="text-body-04 font-bold text-text-muted">내 프로필</h2>
                    <div className="mt-5 flex items-center gap-4 lg:flex-col lg:items-start">
                      <Avatar profileImageUrl={profile.profileImageUrl} size="lg" />
                      <div className="min-w-0 flex-1 lg:w-full">
                        <p className="break-words text-body-02 font-bold leading-relaxed text-text-strong">{profile.nickname}</p>
                        <p className="mt-1 break-all text-body-04 leading-relaxed text-text-muted">{profile.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenModal('profile')}
                      style={{ clipPath: pixelBox(3) }}
                      className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 bg-primary-tint px-4 text-body-04 font-bold text-text-strong transition-colors hover:bg-primary ${FOCUS_RING}`}
                    >
                      프로필 수정
                    </button>
                  </div>
                  <nav aria-label="내 활동 바로가기" className="grid grid-cols-2 divide-x divide-primary-subtle border-t border-primary-subtle p-2 pb-0 lg:block lg:divide-x-0">
                    {SHORTCUTS.map(({ to, label, description }) => (
                      <Link
                        key={to}
                        to={to}
                        viewTransition
                        className={`group flex min-h-11 items-center gap-2 px-2 py-3 transition-colors hover:bg-primary-subtle lg:min-h-18 lg:gap-3 lg:px-3 lg:py-4 ${FOCUS_RING}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-body-04 font-bold text-text-strong">{label}</span>
                          <span className="mt-1 hidden text-xs leading-relaxed text-text-muted lg:block">{description}</span>
                        </span>
                        <Sprite rows={GLYPHS.arrowRight} className="hidden w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5 lg:block" />
                      </Link>
                    ))}
                  </nav>
                  <div className="mx-2 border-t border-primary-subtle pb-2 pt-2">
                    <button
                      ref={accountSettingsButtonRef}
                      type="button"
                      onClick={() => setOpenModal('account')}
                      aria-haspopup="dialog"
                      className={`group flex min-h-11 w-full items-center gap-2 px-2 py-3 text-left transition-colors hover:bg-primary-subtle lg:min-h-14 lg:gap-3 lg:px-3 ${FOCUS_RING}`}
                    >
                      <span className="min-w-0 flex-1 text-body-04 font-bold text-text-strong">계정 설정</span>
                      <Sprite rows={GLYPHS.arrowRight} className="w-3 shrink-0 text-text-muted transition-transform motion-safe:group-hover:translate-x-0.5" />
                    </button>
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
          isLoggingOut={isLoggingOut}
          onClose={closeAccountSettingsFlow}
          onPasswordChange={() => setOpenModal('password')}
          onLogout={() => void handleLogout()}
          onWithdraw={() => setOpenModal('withdraw')}
        />
      )}
      {openModal === 'password' && <PasswordChangeModal onClose={closeAccountSettingsFlow} />}
      {openModal === 'withdraw' && <WithdrawModal onClose={closeAccountSettingsFlow} />}
    </div>
  )
}
