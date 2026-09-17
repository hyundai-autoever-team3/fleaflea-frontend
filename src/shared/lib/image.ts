// 요즘 휴대폰 사진은 5~12MB라 그대로 올리면 업로드가 느리고 서버가 413으로 거절할 수 있다.
// 올리기 전에 긴 변을 줄여 다시 만들어 보낸다.
const MAX_EDGE = 1200
const QUALITY = 0.85

// 상세 화면에서 보이는 최대 폭이 약 360px이라, 고해상도 화면(2배)까지 감안해도 1200px면 충분하다.
export async function shrinkImage(file: File, maxEdge = MAX_EDGE): Promise<File> {
  // 움직이는 GIF는 다시 그리면 첫 프레임만 남으므로 손대지 않는다
  if (file.type === 'image/gif') return file

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

    // 변환에 실패했거나 오히려 커졌으면 원본이 낫다
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    // 브라우저가 지원하지 않거나 읽기에 실패하면 원본을 그대로 올린다
    return file
  }
}
