import { Link } from 'react-router'

export function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <h1 className="font-jua text-head-01 text-text-strong">FleaFlea</h1>
      <p className="max-w-xs text-body-02 text-text-muted">
        우리 동네, 우리끼리 플리마켓
        <br />
        초대받은 사람들끼리 팔고, 나누고, 빌려줘요
      </p>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="rounded-lg bg-primary px-6 py-3 text-body-03 text-white"
        >
          로그인
        </Link>
        <Link
          to="/signup"
          className="rounded-lg border border-border px-6 py-3 text-body-03 text-text"
        >
          회원가입
        </Link>
      </div>
    </main>
  )
}
