import api from './axiosInstance'
import type { User } from '../store/useAuthStore'

export async function requestMagicLink(email: string): Promise<void> {
  await api.post('/api/auth/magic-link/', { email })
}

export async function verifyMagicLink(token: string): Promise<{ access: string; user: User }> {
  const response = await api.post('/api/auth/verify/', { token })
  return response.data
}

export async function loginWithPassword(email: string, password: string): Promise<{ access: string; user: User }> {
  const response = await api.post('/api/auth/login/', { email, password })
  return response.data
}

export async function getProfile(): Promise<User> {
  const response = await api.get('/api/users/me/')
  return response.data
}
