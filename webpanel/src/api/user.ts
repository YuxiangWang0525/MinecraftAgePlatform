import request from '@/utils/request'

export function getProfile() {
  return request.get('/users/profile')
}

export function updateProfile(data: { username?: string; region?: string }) {
  return request.put('/users/profile', data)
}

export function getEnabledPlugins() {
  return request.get('/plugins/enabled')
}

export function getVerifyStatus() {
  return request.get('/users/verify-status')
}

export function verifyIdentity(data: { realName: string; idNumber: string; pluginName?: string }) {
  return request.post('/users/verify', data)
}

export function bindGameAccount(data: { bindCode: string; remark?: string }) {
  return request.post('/server/bind', data)
}

export function getBindCodeInfo(code: string) {
  return request.get('/server/bindCodeInfo', { params: { code } })
}

export function getUserGameAccounts() {
  return request.get('/server/gameAccounts')
}

export function updateGameAccountRemark(id: number, remark: string) {
  return request.put(`/server/gameAccounts/${id}/remark`, { remark })
}
