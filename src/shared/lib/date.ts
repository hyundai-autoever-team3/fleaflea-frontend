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

// 두 날짜 사이의 '박' 수. 대여는 며칠 빌리는지가 바로 보여야 한다
export function nightsBetween(start: string, end: string) {
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86_400_000)
}
