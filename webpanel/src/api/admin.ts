import request from '@/utils/request'

export function getUsers() {
  return request.get('/admin/users')
}

export function getUserById(id: number) {
  return request.get(`/admin/users/${id}`)
}

export function updateUserAge(id: number, data: { ageRange?: string; isMinor?: boolean }) {
  return request.put(`/admin/users/${id}/age`, data)
}

export function deleteUser(id: number) {
  return request.delete(`/admin/users/${id}`)
}

export function createAdmin(data: { username: string; password: string }) {
  return request.post('/admin/create', data)
}

export function getPlugins() {
  return request.get('/plugins')
}

export function getPluginLogs() {
  return request.get('/plugins/logs')
}

export function setPluginEnabled(name: string, data: { enabled: boolean; description?: string }) {
  return request.put(`/plugins/${name}/enabled`, data)
}

export function setPluginDescription(name: string, data: { description: string }) {
  return request.put(`/plugins/${name}/description`, data)
}

export function setPluginConfigValues(name: string, data: { configValues: Record<string, string> }) {
  return request.put(`/plugins/${name}/config`, data)
}

// ===== 认证熔断管理 =====

export function getVerifySettings() {
  return request.get('/admin/verify-settings')
}

export function setVerifySettings(maxAttempts: number) {
  return request.put('/admin/verify-settings', { maxAttempts })
}

export function unlockUserVerify(userId: number) {
  return request.post(`/admin/users/${userId}/unlock-verify`)
}

// ===== 站点设置 =====

export function getSiteSettings() {
  return request.get('/admin/site-settings')
}

export function setSiteSettings(data: { siteName: string; siteDescription: string }) {
  return request.put('/admin/site-settings', data)
}

// ===== API Key 管理 =====

export function getApiKeys() {
  return request.get('/admin/api-keys')
}

export function createApiKey(data: { name: string }) {
  return request.post('/admin/api-keys', data)
}

export function toggleApiKey(id: number, isActive: boolean) {
  return request.put(`/admin/api-keys/${id}/toggle`, { isActive })
}

export function regenerateApiKey(id: number) {
  return request.post(`/admin/api-keys/${id}/regenerate`)
}

export function deleteApiKey(id: number) {
  return request.delete(`/admin/api-keys/${id}`)
}
