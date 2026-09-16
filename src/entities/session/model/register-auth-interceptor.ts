import { api } from '../../../shared/api/axios'
import { useSessionStore } from './store'

export function registerAuthInterceptor() {
  api.interceptors.request.use((confing) => {
    const accessToken = useSessionStore.getState().accessToken
    if (accessToken){
      confing.headers.Authorization = `Bearer ${accessToken}`
    }
    return confing
  })
}
