// 지연 로딩한 화면의 코드를 받는 동안 보여줄 자리.
// 이게 없으면 주소를 직접 열었을 때 라우터가 아무것도 그리지 못하고 화면이 빈다
export function RouteFallback() {
  return (
    <p role="status" className="py-24 text-center text-body-03 text-text-muted">
      화면을 불러오는 중이에요...
    </p>
  )
}
