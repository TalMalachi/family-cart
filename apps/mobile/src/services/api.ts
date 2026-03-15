import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15_000,
})

// Attach JWT on every request
api.interceptors.request.use(async config => {
  const token = await SecureStore.getItemAsync('familycart_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear session and redirect to login
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('familycart_token')
      // useAuth.getState().logout() — import lazily to avoid circular dep
      const { useAuth } = await import('../store/auth')
      useAuth.getState().logout()
    }
    return Promise.reject(err)
  }
)
