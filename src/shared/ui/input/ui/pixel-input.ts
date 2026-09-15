import { pixelBox } from '../../../lib/pixel'

// PixelField 안에 넣는 input/textarea 공통 스타일
export const pixelInputClass =
  'block w-full bg-primary-subtle px-4 text-body-03 text-text-strong outline-none transition-colors placeholder:text-text-muted/50 focus:bg-white'

export const pixelInputStyle = { clipPath: pixelBox() }
