import request from '@/utils/request'

export function login(data: { username: string; password: string }) {
  return request.post('/auth/login', data)
}

export function register(data: { username: string; password: string; region: string }) {
  return request.post('/auth/register', data)
}

export function refreshToken() {
  return request.post('/auth/refresh')
}

export function resetPassword(data: { oldPassword: string; newPassword: string }) {
  return request.put('/auth/reset-password', data)
}
