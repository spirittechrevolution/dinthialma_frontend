import axios, { AxiosInstance, AxiosError } from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearAll } from '@/lib/tokenStorage'
import { ApiError } from '@/types/common'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

// ─── Correcteur de mojibake ───────────────────────────────────────────────────
// Problème : les octets UTF-8 sont interprétés en Latin-1 côté backend/BDD.
// Ex : "Aïcha" stocké UTF-8 → lu en Latin-1 → "AÃ¯cha"
// Détection : séquence 0xC0-0xDF suivie de 0x80-0xBF = octet leader UTF-8 à 2 octets lu en Latin-1
function fixMojibake(str: string): string {
  if (!/[\xC0-\xDF][\x80-\xBF]/.test(str)) return str
  try {
    const bytes = new Uint8Array([...str].map((c) => c.charCodeAt(0)))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return str
  }
}

function deepFix(data: unknown): unknown {
  if (typeof data === 'string') return fixMojibake(data)
  if (Array.isArray(data)) return data.map(deepFix)
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [k, deepFix(v)])
    )
  }
  return data
}

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Injection du Bearer token ────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Refresh automatique ──────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

// Endpoints qui ne doivent pas déclencher un retry après refresh :
// - login / register : erreur 401 = mauvaises credentials (pas de session à rafraîchir)
// - refresh : éviter la récursion
// - logout : inutile de retenter
const SKIP_RETRY = ['/v1/auth/login', '/v1/auth/register', '/v1/auth/refresh', '/v1/auth/logout']

api.interceptors.response.use(
  (response) => { response.data = deepFix(response.data); return response },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const url = originalRequest?.url ?? ''

    if (SKIP_RETRY.some((u) => url.includes(u))) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers!.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearAll()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken })
        const { access_token, refresh_token } = data.data
        setTokens(access_token, refresh_token)
        processQueue(null, access_token)
        originalRequest.headers!.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAll()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
