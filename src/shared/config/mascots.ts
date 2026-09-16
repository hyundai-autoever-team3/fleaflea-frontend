export const MASCOTS = {
  default: '/mascot/flea.png',
  beret: '/mascot/flea2.png',
  surprised: '/mascot/flea4.png',
  smile: '/mascot/flea5.png',
  wink: '/mascot/flea6.png',
  star: '/mascot/flea7.png',
  basket: '/mascot/flea10.png',
} as const

const FALLBACK_MASCOTS = [MASCOTS.smile, MASCOTS.wink, MASCOTS.star, MASCOTS.beret, MASCOTS.surprised]

// 같은 대상(마켓 등)은 항상 같은 마스코트가 나오도록 id로 고정해서 고름
export function pickMascot(seed: number): string {
  return FALLBACK_MASCOTS[Math.abs(seed) % FALLBACK_MASCOTS.length]
}
