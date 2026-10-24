import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('mcap_token'))
  const user = ref<any>(JSON.parse(localStorage.getItem('mcap_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'super_admin' || user.value?.role === 'admin')
  const mustResetPassword = computed(() => user.value?.mustResetPassword === true)

  function setAuth(data: { access_token: string; user: any }) {
    token.value = data.access_token
    user.value = data.user
    localStorage.setItem('mcap_token', data.access_token)
    localStorage.setItem('mcap_user', JSON.stringify(data.user))
  }

  function updateUser(data: any) {
    user.value = { ...user.value, ...data }
    localStorage.setItem('mcap_user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('mcap_token')
    localStorage.removeItem('mcap_user')
  }

  return { token, user, isLoggedIn, isAdmin, mustResetPassword, setAuth, updateUser, logout }
})
