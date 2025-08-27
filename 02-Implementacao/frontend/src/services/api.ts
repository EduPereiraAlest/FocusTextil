import axios from 'axios'
import { toast } from 'sonner'

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const authStore = JSON.parse(localStorage.getItem('focus-auth-storage') || '{}')
    const accessToken = authStore.state?.accessToken
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const authStore = JSON.parse(localStorage.getItem('focus-auth-storage') || '{}')
        const refreshToken = authStore.state?.refreshToken
        
        if (refreshToken) {
          const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          })
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.tokens
          
          // Update stored tokens
          authStore.state.accessToken = accessToken
          authStore.state.refreshToken = newRefreshToken
          localStorage.setItem('focus-auth-storage', JSON.stringify(authStore))
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        localStorage.removeItem('focus-auth-storage')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    
    // Handle other errors
    if (error.response) {
      const message = error.response.data?.message || 'Ocorreu um erro'
      
      if (error.response.status >= 500) {
        toast.error('Erro interno do servidor')
      } else if (error.response.status === 403) {
        toast.error('Acesso negado')
      } else if (error.response.status !== 401) {
        toast.error(message)
      }
    } else if (error.request) {
      toast.error('Erro de conexão com o servidor')
    } else {
      toast.error('Erro inesperado')
    }
    
    return Promise.reject(error)
  }
)