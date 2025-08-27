import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/authApi'

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'user'
  lastLogin?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  refreshTokens: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(email, password)
          
          set({
            user: response.user,
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        const { refreshToken } = get()
        if (refreshToken) {
          authApi.logout(refreshToken).catch(console.error)
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        })
      },

      setUser: (user: User) => {
        set({ user })
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ 
          accessToken, 
          refreshToken, 
          isAuthenticated: true 
        })
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        })
      },

      refreshTokens: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        try {
          const response = await authApi.refresh(refreshToken)
          set({
            accessToken: response.tokens.accessToken,
            refreshToken: response.tokens.refreshToken
          })
        } catch (error) {
          get().clearAuth()
          throw error
        }
      },

      checkAuth: async () => {
        const { accessToken, refreshToken } = get()
        
        if (!accessToken || !refreshToken) {
          get().clearAuth()
          return
        }

        set({ isLoading: true })
        
        try {
          const user = await authApi.getProfile()
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false 
          })
        } catch (error) {
          // Try to refresh token
          try {
            await get().refreshTokens()
            const user = await authApi.getProfile()
            set({ 
              user, 
              isAuthenticated: true,
              isLoading: false 
            })
          } catch (refreshError) {
            get().clearAuth()
            set({ isLoading: false })
          }
        }
      }
    }),
    {
      name: 'focus-auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)