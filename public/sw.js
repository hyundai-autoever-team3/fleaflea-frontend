//캐시 이름 저장할 파일이 바뀌면 v1 -> v2처럼 올려서 예전 캐시와 구분
const CACHE_NAME = 'fleaflea-offline-v1'

//인터넷이 끊겼을 때 보여줄 화면과, 그 화면이 쓰는 이미지
const OFFLINE_URL = '/offline.html'
const OFFLINE_ASSETS = [OFFLINE_URL, '/mascot/flea4.png']

//1) 설치 : 오프라인 화면을 미리 저장해둔다
self.addEventListener('install', (event) => {
    console.log('[SW] install:설치됨')

    //저장이 끝날 때까지 설치를 끝내지 말라고 브라우저에 알린다
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            cache.addAll(OFFLINE_ASSETS)),
    )
})

//2) 활성화 : 이름이 다른 예전 캐시를 지운다
self.addEventListener('activate', (event) => {
    console.log('[SW] activate: 활성화됨')

    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name)),
            ),
        ),
    )
})

//3) 요청 가로채기
self.addEventListener('fetch', (event)=>{
    const { request } = event

    //페이지 이동(주소 입력, 새로고침): 서버에서 받아 보고, 실패하면 오프라인 화면
    if(request.mode === 'navigate'){
        event.respondWith(
            fetch(request).catch(() => caches.match(OFFLINE_URL)),
        )
        return
    }

    //오프라인 화면이 쓰는 이미지 : 저장해 둔 것을 먼저 쓴다
    const url = new URL(request.url)
    if(OFFLINE_ASSETS.includes(url.pathname)){
        event.respondWith(
            caches.match(request).then((cached) => cached ??
                fetch(request)),
        )
    }
})