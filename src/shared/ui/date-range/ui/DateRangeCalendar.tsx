import { useState } from 'react'

import { toDateString, todayString } from '../../../lib/date'
import { pixelBox } from '../../../lib/pixel'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const FOCUS_RING = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'

interface DateRangeCalendarProps {
  start: string
  end: string
  // 시작일만 고른 중간 상태도 그대로 올려보낸다. 바깥에서 안내 문구를 바꾸기 위함
  onChange: (next: { start: string; end: string }) => void
  minDate?: string
  labelledBy?: string
}

export function DateRangeCalendar({
  start,
  end,
  onChange,
  minDate = todayString(),
  labelledBy,
}: DateRangeCalendarProps) {
  // 고른 날이 있으면 그 달부터 보여준다
  const [cursor, setCursor] = useState(() => {
    const base = new Date(`${start || minDate}T00:00:00`)
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const first = new Date(cursor.year, cursor.month, 1)
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  // 1일이 무슨 요일인지에 맞춰 앞을 비워 둔다
  const leading = first.getDay()

  function moveMonth(step: number) {
    setCursor((current) => {
      const moved = new Date(current.year, current.month + step, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  function pick(day: string) {
    // 시작일만 있거나 이미 둘 다 골랐으면 새로 시작한다.
    // 시작일보다 앞을 누르면 그 날을 새 시작일로 삼는 게 자연스럽다
    if (!start || end || day < start) {
      onChange({ start: day, end: '' })
      return
    }
    onChange({ start, end: day })
  }

  const cells = Array.from({ length: leading + daysInMonth }, (_, index) => {
    if (index < leading) return null
    return toDateString(new Date(cursor.year, cursor.month, index - leading + 1))
  })

  return (
    <div style={{ clipPath: pixelBox(4) }} className="bg-primary-tint p-[2px]">
      <div style={{ clipPath: pixelBox(4) }} className="bg-bg p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="이전 달"
            style={{ clipPath: pixelBox(2) }}
            className={`grid size-9 place-items-center bg-primary-subtle text-text-strong transition-colors hover:bg-primary-tint ${FOCUS_RING}`}
          >
            ‹
          </button>
          <p aria-live="polite" className="text-body-03 font-bold text-text-strong">
            {cursor.year}년 {cursor.month + 1}월
          </p>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="다음 달"
            style={{ clipPath: pixelBox(2) }}
            className={`grid size-9 place-items-center bg-primary-subtle text-text-strong transition-colors hover:bg-primary-tint ${FOCUS_RING}`}
          >
            ›
          </button>
        </div>

        <div role="grid" aria-labelledby={labelledBy} className="mt-3">
          <div role="row" className="grid grid-cols-7">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday} role="columnheader" className="py-1 text-center text-[11px] text-text-muted">
                {weekday}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, index) => {
              if (!day) return <span key={`blank-${index}`} aria-hidden="true" />

              const disabled = day < minDate
              const isStart = day === start
              const isEnd = day === end
              const inRange = Boolean(start && end) && day > start && day < end
              const edge = isStart || isEnd
              const hasRange = Boolean(start && end)
              const rangeTrack = !hasRange || (isStart && isEnd)
                ? ''
                : isStart
                  ? 'bg-[linear-gradient(to_right,transparent_50%,var(--color-primary-subtle)_50%)]'
                  : isEnd
                    ? 'bg-[linear-gradient(to_right,var(--color-primary-subtle)_50%,transparent_50%)]'
                    : inRange
                      ? 'bg-primary-subtle'
                      : ''

              return (
                <button
                  key={day}
                  type="button"
                  role="gridcell"
                  disabled={disabled}
                  aria-pressed={edge || inRange}
                  aria-label={`${cursor.month + 1}월 ${Number(day.slice(-2))}일`}
                  onClick={() => pick(day)}
                  className={`group grid h-10 place-items-center text-body-04 disabled:pointer-events-none disabled:text-text-muted/40 ${rangeTrack} ${FOCUS_RING}`}
                >
                  <span className={`relative z-10 grid size-9 place-items-center rounded-full transition-colors ${
                    edge
                      ? 'bg-primary font-bold text-white'
                      : inRange
                        ? 'text-text-strong'
                        : 'text-text group-hover:bg-primary-subtle'
                  }`}>
                    {Number(day.slice(-2))}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
