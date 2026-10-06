// 상세 사진과 마켓 커버의 해상도를 확보하되, 업로드 용량에 맞춰 단계적으로 축소한다.
const MAX_EDGE = 1600
const QUALITY = 0.9

// multipart 본문이 서버의 1MB 제한을 넘지 않도록 파일 크기에 여유를 둔다.
const MAX_UPLOAD_BYTES = 900_000

// 높은 해상도와 품질부터 시도하고 용량 제한을 만족하면 종료한다.
// 모든 시도가 제한을 넘으면 마지막 결과를 보내 서버에서 검증한다.
const ATTEMPTS: [edge: number, quality: number][] = [
  [MAX_EDGE, QUALITY],
  [MAX_EDGE, 0.82],
  [1200, 0.82],
  [1200, 0.72],
  [900, 0.7],
  [700, 0.6],
  [500, 0.5],
]

// 지원하지 않는 형식은 브라우저에서 디코딩할 수 있을 때 WebP 또는 JPEG로 변환한다.
const SERVER_SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function isServerSupportedImage(file: File) {
  return SERVER_SUPPORTED.has(file.type)
}

// WebP 인코딩을 지원하지 않는 브라우저는 PNG를 반환할 수 있어 실제 MIME 타입을 확인한다.
let webpSupport: Promise<boolean> | null = null

function canEncodeWebp() {
  webpSupport ??= new Promise<boolean>((resolve) => {
    const probe = document.createElement('canvas')
    probe.width = 1
    probe.height = 1
    probe.toBlob((blob) => resolve(blob?.type === 'image/webp'), 'image/webp')
  })

  return webpSupport
}

function encode(bitmap: ImageBitmap, maxEdge: number, quality: number, mimeType: string) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)

  // 축소 시 가장자리의 계단 현상을 줄인다.
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  // 출력 형식에 관계없이 투명 영역을 흰색 배경으로 합성한다.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })
}

export async function shrinkImage(file: File, maxEdge = MAX_EDGE): Promise<File> {
  try {
    // EXIF 회전 정보를 적용한 뒤 크기를 계산한다.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    // 형식·용량·해상도를 모두 만족하면 재인코딩에 따른 화질 손실을 피한다.
    const longestEdge = Math.max(bitmap.width, bitmap.height)
    if (isServerSupportedImage(file) && file.size <= MAX_UPLOAD_BYTES && longestEdge <= maxEdge) {
      bitmap.close()
      return file
    }

    const mimeType = (await canEncodeWebp()) ? 'image/webp' : 'image/jpeg'

    let blob: Blob | null = null
    for (const [edge, quality] of ATTEMPTS) {
      blob = await encode(bitmap, Math.min(edge, maxEdge), quality, mimeType)
      if (!blob || blob.size <= MAX_UPLOAD_BYTES) break
    }

    bitmap.close()

    if (!blob) return file

    // 서버가 받을 수 있는 원본은 변환본보다 작으면 유지한다.
    // 미지원 형식은 변환 후 용량이 늘어도 변환본을 사용한다.
    if (isServerSupportedImage(file) && file.size <= MAX_UPLOAD_BYTES && blob.size >= file.size)
      return file

    const name = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.jpg')

    return new File([blob], name, { type: blob.type, lastModified: Date.now() })
  } catch {
    // 브라우저에서 변환할 수 없으면 원본을 보내고 서버의 이미지 검증 결과를 따른다.
    return file
  }
}

// 알려진 이미지 오류 코드 외에는 null을 반환해 호출부의 일반 오류 안내로 넘긴다.
export function getImageErrorMessage(code: string | undefined) {
  switch (code) {
    case 'INVALID_IMAGE':
    case 'INVALID_PROFILE_IMAGE_REQUEST':
      return '이 사진은 올릴 수 없어요. JPG, PNG, WebP로 저장해서 다시 올려 주세요.'
    case 'IMAGE_TOO_LARGE':
      return '사진 용량이 너무 커요. 더 작은 사진으로 올려 주세요.'
    default:
      return null
  }
}
