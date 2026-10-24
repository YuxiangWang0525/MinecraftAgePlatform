<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Form, Input, Button, Card, message, Typography } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  if (!form.username || !form.password) {
    message.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await login(form)
    if (res.user.role !== 'super_admin' && res.user.role !== 'admin') {
      message.error('无管理员权限')
      return
    }
    authStore.setAuth(res)
    if (res.user.mustResetPassword) {
      message.warning('首次登录，必须重置密码')
      router.push('/admin/reset-password')
    } else {
      const redirect = (route.query.redirect as string)
      router.push(redirect || '/admin/dashboard')
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5">
    <Card style="width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.08)">
      <div style="text-align: center; margin-bottom: 24px">
        <Icon icon="mdi:shield-crown" style="font-size: 48px; color: #1677ff" />
        <Typography.Title :level="3" style="margin-top: 12px; margin-bottom: 0">
          MCAP 管理员登录
        </Typography.Title>
      </div>
      <Form layout="vertical">
        <Form.Item label="管理员账号">
          <Input v-model:value="form.username" placeholder="请输入管理员账号" size="large">
            <template #prefix><Icon icon="mdi:account-tie" /></template>
          </Input>
        </Form.Item>
        <Form.Item label="密码">
          <Input.Password v-model:value="form.password" placeholder="请输入密码" size="large">
            <template #prefix><Icon icon="mdi:lock" /></template>
          </Input.Password>
        </Form.Item>
        <Form.Item>
          <Button type="primary" :loading="loading" block size="large" @click="handleLogin">
            登录管理后台
          </Button>
        </Form.Item>
      </Form>
      <Button type="link" block @click="router.push('/login')">返回用户登录</Button>
    </Card>
  </div>
</template>
