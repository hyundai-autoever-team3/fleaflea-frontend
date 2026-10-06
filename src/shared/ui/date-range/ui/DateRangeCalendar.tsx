import { useState } from 'react'

import { toDateString, todayString } from '../../../lib/date'
import { pixelBox } from '../../../lib/pixel'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-text-strong'

interface DateRangeCalendarProps {
  start: string
  end: string
  // 시작일만 선택한 상태는 end를 비워 전달한다.
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
  const [cursor, setCursor] = useState(() => {
    const base = new Date(`${start || minDate}T00:00:00`)
    return { year: base.getFullYear(), month: base.getMonth() }
  })

  const first = new Date(cursor.year, cursor.month, 1)
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()

  // 첫 주에서 1일 이전 요일은 빈 칸으로 채운다.
  const leading = first.getDay()

  // 선택 가능한 날짜가 없는 이전 달로는 이동하지 않는다.
  const atFirstMonth =
    `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}` <= minDate.slice(0, 7)

  function moveMonth(step: number) {
    setCursor((current) => {
      const moved = new Date(current.year, current.month + step, 1)
      return { year: moved.getFullYear(), month: moved.getMonth() }
    })
  }

  function pick(day: string) {
    // 선택 전, 범위 선택 완료 후, 시작일보다 이른 날짜를 누른 경우에는 새 범위를 시작한다.
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
            disabled={atFirstMonth}
            aria-label="이전 달"
            style={{ clipPath: pixelBox(2) }}
            className={`grid size-9 place-items-center bg-primary-subtle text-text-strong transition-colors hover:bg-primary-tint disabled:pointer-events-none disabled:text-text-muted/40 ${FOCUS_RING}`}
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
              <span
                key={weekday}
                role="columnheader"
                className="py-1 text-center text-[11px] text-text-muted"
              >
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

              // 범위 양 끝은 절반만 칠해 날짜 원과 이어지는 배경을 만든다.
              const rangeTrack =
                !hasRange || (isStart && isEnd)
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
                  aria-label={`${cursor.month + 1}월 ${Number(day.slice(-2))}일${disabled ? ', 지난 날짜' : ''}`}
                  onClick={() => pick(day)}
                  className={`group grid h-10 place-items-center text-body-04 disabled:pointer-events-none disabled:text-text-muted/40 ${rangeTrack} ${FOCUS_RING}`}
                >
                  {/* 날짜의 색을 직접 지정하므로 비활성 색도 이 요소에 적용한다. */}
                  <span
                    className={`relative z-10 grid size-9 place-items-center rounded-full transition-colors ${
                      disabled
                        ? 'text-text-muted/40'
                        : edge
                          ? 'bg-primary font-bold text-white'
                          : inRange
                            ? 'text-text-strong'
                            : 'text-text group-hover:bg-primary-subtle'
                    }`}
                  >
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
