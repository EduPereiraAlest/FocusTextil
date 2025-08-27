import { api } from './api'

export interface LoginResponse {
  message: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'user'
    lastLogin: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: string
  }
}

export interface RefreshResponse {
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: string
  }
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  async getProfile() {
    const response = await api.get('/auth/me')
    return response.data.user
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    })
  }
}