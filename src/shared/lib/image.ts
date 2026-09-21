// 요즘 휴대폰 사진은 5~12MB라 그대로 올리면 업로드가 느리고 서버가 413으로 거절할 수 있다.
// 올리기 전에 긴 변을 줄여 다시 만들어 보낸다.
const MAX_EDGE = 1200
const QUALITY = 0.85

// 서버는 JPEG와 PNG만 받는다(ImageIO로 형식을 읽어 그 둘만 통과시킨다).
// 그 밖의 형식은 그대로 올리면 400으로 막히므로 반드시 JPEG로 바꿔 보낸다
const SERVER_SUPPORTED = new Set(['image/jpeg', 'image/png'])

export function isServerSupportedImage(file: File) {
  return SERVER_SUPPORTED.has(file.type)
}

// 상세 화면에서 보이는 최대 폭이 약 360px이라, 고해상도 화면(2배)까지 감안해도 1200px면 충분하다.
export async function shrinkImage(file: File, maxEdge = MAX_EDGE): Promise<File> {
  try {
    // 휴대폰 사진은 회전 정보가 따로 들어 있어, 그대로 그리면 옆으로 눕는다
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close()
      return file
    }

    // 투명한 PNG를 JPEG로 바꾸면 투명한 부분이 검게 나오므로 흰 바탕을 먼저 깔아둔다
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', QUALITY)
    })

    if (!blob) return file
    // 원본이 서버가 받는 형식일 때만 더 작은 쪽을 고른다.
    // WebP·HEIC·GIF처럼 서버가 못 받는 형식은 커지더라도 변환본을 보내야 한다
    if (isServerSupportedImage(file) && blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    // 브라우저가 지원하지 않거나 읽기에 실패하면 원본을 그대로 올린다
    return file
  }
}

// 서버가 이미지를 거절했을 때 내려주는 코드. '입력을 확인하세요'로는
// 사진이 문제라는 걸 알 수 없어, 무엇을 바꿔야 하는지 그대로 알려준다
export function getImageErrorMessage(code: string | undefined) {
  switch (code) {
    case 'INVALID_IMAGE':
    case 'INVALID_PROFILE_IMAGE_REQUEST':
      return '이 사진은 올릴 수 없어요. JPG나 PNG로 저장해서 다시 올려 주세요.'
    case 'IMAGE_TOO_LARGE':
      return '사진 용량이 너무 커요. 더 작은 사진으로 올려 주세요.'
    default:
      return null
  }
}
