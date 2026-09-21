// 요즘 휴대폰 사진은 5~12MB라 그대로 올리면 업로드가 느리고 서버가 거절한다.
// 올리기 전에 긴 변을 줄여 다시 만들어 보낸다.
const MAX_EDGE = 1200
const QUALITY = 0.85

// 서버 앞단 nginx가 1MB에서 요청을 끊는다. 그 이상은 백엔드에 닿지도 못하고 413이 난다.
// 경계에 걸치지 않도록 여유를 두고 이 아래로 맞춘다
const MAX_UPLOAD_BYTES = 900_000

// 한 번 구워서 예산을 넘으면 크기와 품질을 한 단씩 낮춰 다시 굽는다.
// 큰 쪽부터 시도하다 처음으로 예산에 들어오는 것을 쓴다
const ATTEMPTS: [edge: number, quality: number][] = [
  [MAX_EDGE, QUALITY],
  [MAX_EDGE, 0.7],
  [900, 0.7],
  [700, 0.6],
  [500, 0.5],
]

// 서버가 받는 형식. WebP가 더해져(imageio-webp로 실제 해독까지 한다)
// 요즘 사진을 그대로 올릴 수 있는 경우가 늘었다.
// 여기 없는 형식(HEIC·GIF 등)은 그대로 올리면 400이므로 반드시 JPEG로 바꿔 보낸다
const SERVER_SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function isServerSupportedImage(file: File) {
  return SERVER_SUPPORTED.has(file.type)
}

function encode(bitmap: ImageBitmap, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)

  // 투명한 PNG를 JPEG로 바꾸면 투명한 부분이 검게 나오므로 흰 바탕을 먼저 깔아둔다
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}

// 상세 화면에서 보이는 최대 폭이 약 360px이라, 고해상도 화면(2배)까지 감안해도 1200px면 충분하다.
export async function shrinkImage(file: File, maxEdge = MAX_EDGE): Promise<File> {
  try {
    // 휴대폰 사진은 회전 정보가 따로 들어 있어, 그대로 그리면 옆으로 눕는다
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    let blob: Blob | null = null
    for (const [edge, quality] of ATTEMPTS) {
      blob = await encode(bitmap, Math.min(edge, maxEdge), quality)
      if (!blob || blob.size <= MAX_UPLOAD_BYTES) break
    }
    bitmap.close()

    if (!blob) return file
    // 원본이 서버가 받는 형식이고 용량도 예산에 들어오면 더 작은 쪽을 그대로 쓴다.
    // HEIC·GIF처럼 서버가 못 받는 형식은 커지더라도 변환본을 보내야 한다
    if (isServerSupportedImage(file) && file.size <= MAX_UPLOAD_BYTES && blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    // 브라우저가 읽지 못하는 형식(HEIC 등)은 손댈 수 없어 원본을 그대로 올린다.
    // 서버가 거절하면 화면에서 아래 문구로 안내한다
    return file
  }
}

// 서버가 이미지를 거절했을 때 내려주는 코드. '입력을 확인하세요'로는
// 사진이 문제라는 걸 알 수 없어, 무엇을 바꿔야 하는지 그대로 알려준다
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
