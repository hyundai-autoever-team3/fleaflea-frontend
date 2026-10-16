import { env } from '../../shared/config/env'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

//배포 빌드에서만 수집, 개발 중 접속이 섞이면 방문 수가 펌핑 됨
export function initAnalytics() {
  if (!import.meta.env.PROD || !env.gaMeasurementId) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${env.gaMeasurementId}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', env.gaMeasurementId)
}
