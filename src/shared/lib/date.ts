// 날짜는 'YYYY-MM-DD' 문자열로만 주고받는다. Date 객체를 넘기면
// 시간대 때문에 하루씩 밀리는 일이 생긴다
export function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayString() {
  return toDateString(new Date())
}

// 시작일과 종료일을 모두 포함한 대여 일수.
// 날짜 문자열을 UTC로 계산해 일광 절약 시간 전환 지역에서도 하루가 어긋나지 않게 한다
export function daysBetween(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const from = Date.UTC(startYear, startMonth - 1, startDay)
  const to = Date.UTC(endYear, endMonth - 1, endDay)
  return Math.round((to - from) / 86_400_000) + 1
}
