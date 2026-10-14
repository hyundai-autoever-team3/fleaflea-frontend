import { MASCOTS } from '../../../shared/config/mascots'

// 백엔드 채팅은 글자만 주고받는다. 스티커는 약속한 글자 "[sticker:이름]"을 보내고
// 받는 쪽 화면이 그 글자를 그림으로 바꿔 그린다. 서버는 평범한 글자 메시지로 저장한다
export const STICKERS = [
  { id: 'hello', label: '플리', src: MASCOTS.default },
  { id: 'smile', label: '웃음', src: MASCOTS.smile },
  { id: 'wink', label: '윙크', src: MASCOTS.wink },
  { id: 'surprised', label: '깜짝', src: MASCOTS.surprised },
  { id: 'star', label: '반짝', src: MASCOTS.star },
  { id: 'beret', label: '베레모', src: MASCOTS.beret },
  { id: 'basket', label: '장바구니', src: MASCOTS.basket },
] as const

export type Sticker = (typeof STICKERS)[number]

const STICKER_PATTERN = /^\[sticker:([a-z0-9-]+)\]$/

export function toStickerContent(id: Sticker['id']) {
  return `[sticker:${id}]`
}

// 스티커 글자가 아니면 null. 모르는 이름이면 그림 없이 "스티커"라는 글자로 보여 주도록 unknown을 돌려준다
export function parseSticker(content: string): Sticker | 'unknown' | null {
  const match = STICKER_PATTERN.exec(content.trim())
  if (!match) return null

  return STICKERS.find((sticker) => sticker.id === match[1]) ?? 'unknown'
}

// 채팅방 목록의 마지막 메시지 미리보기에 쓴다
export function previewContent(content: string) {
  return parseSticker(content) ? '스티커를 보냈어요' : content
}
