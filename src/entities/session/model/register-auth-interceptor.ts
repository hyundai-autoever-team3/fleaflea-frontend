import { api } from '../../../shared/api/axios'
import { useSessionStore } from './store'

// Call this once during app bootstrap (app/provider) — kept out of shared/api/axios.ts
// because shared must not import from entities (FSD layering).
export function registerAuthInterceptor() {
  api.interceptors.request.use((config) => {
    const token = useSessionStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}
