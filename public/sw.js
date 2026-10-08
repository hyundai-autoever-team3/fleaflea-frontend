// 서비스 워커 안에서는 window 대신 self가 자기 자신을 가리킨다

// 1) 설치 : 이 파일이 처음 등록되거나 내용이 바뀌었을 때 한 번 실행
self.addEventListener('install', () => {
    console.log('[SW] install: 설치됨')
})

// 2) 활성화 : 설치가 끝나고 이 서비스 워커가 일을 시작할 때 시작 된다
self.addEventListener('activate', () => {
    console.log('[SW] activate: 활성화됨')
})

// 3) 요청 가로채기 : 페이지가 무언가를 요청할 때마다 실행
self.addEventListener('fetch', (event) => {
    console.log('[SW] fetch:', event.request.method,
        event.request.url)
})