<script setup lang="ts">
import { Layout, Button, Space, Typography } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const { Header } = Layout
const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <Header style="background: #fff; padding: 0 24px; display: flex; justify-content: flex-end; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.06)">
    <Space>
      <Typography.Text>{{ authStore.user?.username }}</Typography.Text>
      <Button type="text" @click="handleLogout">
        <template #icon>
          <Icon icon="mdi:logout" />
        </template>
        退出登录
      </Button>
    </Space>
  </Header>
</template>
