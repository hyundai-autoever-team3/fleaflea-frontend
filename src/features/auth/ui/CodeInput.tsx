import { useState } from 'react'
import type { Ref } from 'react'

import { pixelBox } from '../../../shared/lib/pixel'
import { CODE_LENGTH } from '../model/useEmailVerification'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  // 6자리를 모두 채우거나 Enter를 누르면 호출한다
  onComplete: (value: string) => void
  invalid?: boolean
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
}

// 실제 입력칸은 하나만 두고 화면에는 6칸으로 나눠 그린다.
// 칸마다 input을 두면 붙여넣기, 지우기, 메일 앱의 코드 자동 입력을 각각 처리해야 한다
export function CodeInput({
  value,
  onChange,
  onComplete,
  invalid = false,
  disabled = false,
  inputRef,
}: CodeInputProps) {
  const [focused, setFocused] = useState(false)
  // 다음에 입력될 칸. 다 채우면 마지막 칸에 머문다
  const activeIndex = Math.min(value.length, CODE_LENGTH - 1)

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
          onChange(next)
          if (next.length === CODE_LENGTH && next !== value) onComplete(next)
        }}
        onKeyDown={(event) => {
          // 회원가입 폼 안에 있으므로 Enter가 가입 제출로 이어지지 않게 막고 코드 확인으로 처리한다
          if (event.key === 'Enter') {
            event.preventDefault()
            onComplete(value)
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        aria-label="인증 코드 6자리"
        aria-invalid={invalid}
        // 글자를 16px보다 작게 하면 아이폰이 포커스할 때 화면을 확대한다
        className="absolute inset-0 z-10 h-full w-full cursor-text text-[16px] text-transparent caret-transparent opacity-0 disabled:cursor-default"
      />

      <div aria-hidden="true" className="grid grid-cols-6 gap-2">
        {Array.from({ length: CODE_LENGTH }, (_, index) => {
          const digit = value[index] ?? ''
          const active = focused && index === activeIndex

          // PixelField와 같은 방식: 바깥 판 색이 테두리가 된다
          return (
            <div
              key={index}
              style={{ clipPath: pixelBox() }}
              className={`p-[2px] transition-colors ${
                active ? 'bg-primary' : invalid ? 'bg-red-300' : 'bg-primary-subtle'
              } ${disabled ? 'opacity-50' : ''}`}
            >
              <div
                style={{ clipPath: pixelBox() }}
                className={`flex h-12 items-center justify-center text-head-03 font-bold text-text-strong transition-colors ${
                  active ? 'bg-white' : 'bg-primary-subtle'
                }`}
              >
                {digit ||
                  (active && (
                    <span className="h-6 w-0.5 bg-text-strong motion-safe:animate-pulse" />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
