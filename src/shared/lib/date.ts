// 대여 날짜는 시간대 변환 없이 사용자의 현지 날짜를 YYYY-MM-DD 형식으로 전달한다.
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
// UTC 기준으로 차이를 계산해 일광 절약 시간 전환에 영향을 받지 않게 한다.
export function daysBetween(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)

  const from = Date.UTC(startYear, startMonth - 1, startDay)
  const to = Date.UTC(endYear, endMonth - 1, endDay)

  return Math.round((to - from) / 86_400_000) + 1
}
