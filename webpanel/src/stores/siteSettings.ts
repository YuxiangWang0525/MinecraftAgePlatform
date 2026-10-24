import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useSiteSettingsStore = defineStore('siteSettings', () => {
  const siteName = ref('MCAP 实名认证系统')
  const siteDescription = ref('')
  const loaded = ref(false)

  const displayName = computed(() => siteName.value || 'MCAP 实名认证系统')

  async function fetch() {
    try {
      const res: any = await axios.get('/api/site/info')
      siteName.value = res.siteName || 'MCAP 实名认证系统'
      siteDescription.value = res.siteDescription || ''
      loaded.value = true
    } catch {
      // 使用默认值
    }
  }

  function update(name: string, description: string) {
    siteName.value = name
    siteDescription.value = description
  }

  return { siteName, siteDescription, loaded, displayName, fetch, update }
})
