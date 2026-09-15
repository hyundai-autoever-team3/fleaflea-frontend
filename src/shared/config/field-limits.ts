// 백엔드 Swagger 요청 스키마(minLength/maxLength)와 맞춘 입력 제한
export const FIELD_LIMITS = {
  password: { min: 8, max: 20 },
  nickname: { min: 2, max: 20 },
  marketTitle: { max: 100 },
  marketDescription: { max: 1000 },
  productTitle: { max: 150 },
  productDescription: { max: 2000 },
} as const

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
