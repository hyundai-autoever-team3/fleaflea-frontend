// 실제 화면 캡처를 보여주는 칸. 사진은 public/landing에 둔다.
// 캡처 원본 크기를 적어 두어 사진이 뜨기 전에도 자리가 잡혀 화면이 밀리지 않게 한다
export function FeaturePhoto({
  src,
  width,
  height,
  alt,
  caption,
  small = false,
}: {
  src: string
  width: number
  height: number
  alt: string
  caption: string
  // 작은 창을 찍은 캡처는 다른 화면 캡처와 같은 폭으로 늘리면 내용이 유독 크게 보인다
  small?: boolean
}) {
  return (
    <figure className={`mx-auto w-full min-w-0 ${small ? 'max-w-md' : 'max-w-xl'}`}>
      <img
        draggable={false}
        src={src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        // 캡처의 둥근 모서리(투명 영역)를 따라 그림자가 지도록 box-shadow 대신 필터를 쓴다
        className="block h-auto w-full rounded-2xl drop-shadow-lg"
      />
      <figcaption className="mt-4 text-center text-body-04 text-text-muted">{caption}</figcaption>
    </figure>
  )
}
