import axios, { AxiosInstance, AxiosError } from 'axios'
import { getAccessToken, getRefreshToken, setTokens, clearAll } from '@/lib/tokenStorage'
import { ApiError } from '@/types/common'

// Le backend expose ses routes sous /api (context-path) + /v1 (version)
// Ex: http://localhost:8081/api/v1/auth/login
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Intercepteur requête : injection du Bearer token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Gestion du refresh token ─────────────────────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

// Endpoints publics d'auth : ne pas tenter de refresh sur leurs 401
const AUTH_URLS = ['/v1/auth/login', '/v1/auth/login-pin', '/v1/auth/refresh', '/v1/auth/register', '/v1/auth/logout']

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }
    const url = originalRequest?.url ?? ''

    // Laisser passer les erreurs des endpoints d'auth directement au appelant
    if (AUTH_URLS.some((u) => url.includes(u))) {
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
        const { data } = await axios.post(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refreshToken }
        )
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
