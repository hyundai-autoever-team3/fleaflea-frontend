/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_SOCIAL_LOGIN_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
