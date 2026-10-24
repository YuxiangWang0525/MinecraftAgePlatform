import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'
import router from './router'
import { useSiteSettingsStore } from './stores/siteSettings'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

// 在挂载前加载站点设置（公开接口，无需认证）
const siteSettings = useSiteSettingsStore()
siteSettings.fetch().finally(() => {
  app.mount('#app')
})
