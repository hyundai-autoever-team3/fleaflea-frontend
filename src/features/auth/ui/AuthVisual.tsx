import { StarField } from '../../../shared/ui/star-field'

// 로그인·회원가입 폼 옆에 두는 우주 그림. 좁은 화면에서는 숨긴다.
// fill: 그림 크기가 높이를 정하지 않고 옆 폼 높이에 맞춰 채운다. 모달처럼 높이가 한정된 자리에서 쓴다
export function AuthVisual({ fill = false }: { fill?: boolean }) {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl bg-cosmic-bg md:block">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, var(--color-cosmic-tint) 0%, transparent 60%), linear-gradient(180deg, var(--color-cosmic-bg), var(--color-cosmic))',
        }}
      />
      <StarField />
      <img
        draggable={false}
        src="/mascot/flea-bg.png"
        alt=""
        className={`${fill ? 'absolute inset-0' : 'relative'} h-full w-full object-cover`}
      />
    </div>
  )
}
