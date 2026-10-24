<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Form, Input, Button, Card, message, Typography, Divider, Space } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRouter, useRoute } from 'vue-router'
import { login, register } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const siteSettings = useSiteSettingsStore()
const loading = ref(false)
const isRegister = ref(false)

const loginForm = reactive({ username: '', password: '' })
const regUsername = ref('')
const regPassword = ref('')
const regRegion = ref('')

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) {
    message.warning('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await login(loginForm)
    authStore.setAuth(res)
    if (res.user.mustResetPassword) {
      message.info('首次登录，请重置密码')
      router.push('/admin/reset-password')
    } else {
      const redirect = (route.query.redirect as string)
      if (redirect) {
        router.push(redirect)
      } else if (authStore.isAdmin) {
        router.push('/admin/dashboard')
      } else {
        router.push('/user/profile')
      }
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!regUsername.value || !regPassword.value || !regRegion.value) {
    message.warning('请填写所有字段')
    return
  }
  loading.value = true
  try {
    const res: any = await register({
      username: regUsername.value,
      password: regPassword.value,
      region: regRegion.value,
    })
    authStore.setAuth(res)
    message.success('注册成功')
    const redirect = (route.query.redirect as string)
    router.push(redirect || '/user/profile')
  } catch (err: any) {
    message.error(err.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5">
    <Card style="width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.08)">
      <div style="text-align: center; margin-bottom: 24px">
        <Icon icon="mdi:shield-account" style="font-size: 48px; color: #1677ff" />
        <Typography.Title :level="3" style="margin-top: 12px; margin-bottom: 0">
          {{ siteSettings.displayName }}
        </Typography.Title>
        <div v-if="siteSettings.siteDescription" style="color: #999; font-size: 13px; margin-top: 4px">
          {{ siteSettings.siteDescription }}
        </div>
      </div>

      <div v-show="!isRegister">
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input v-model:value="loginForm.username" placeholder="请输入用户名" size="large">
              <template #prefix><Icon icon="mdi:account" /></template>
            </Input>
          </Form.Item>
          <Form.Item label="密码">
            <Input.Password v-model:value="loginForm.password" placeholder="请输入密码" size="large">
              <template #prefix><Icon icon="mdi:lock" /></template>
            </Input.Password>
          </Form.Item>
          <Form.Item>
            <Button type="primary" :loading="loading" block size="large" @click="handleLogin">
              登录
            </Button>
          </Form.Item>
        </Form>
        <Divider style="margin: 12px 0" />
        <Space direction="vertical" style="width: 100%; text-align: center">
          <Button type="link" @click="isRegister = true">没有账号？立即注册</Button>
          <Button type="link" @click="router.push('/admin/login')">管理员登录</Button>
        </Space>
      </div>

      <div v-show="isRegister">
        <Form layout="vertical">
          <Form.Item label="用户名">
            <Input v-model:value="regUsername" placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item label="密码">
            <Input.Password v-model:value="regPassword" placeholder="请输入密码(至少6位)" size="large" />
          </Form.Item>
          <Form.Item label="所在地域">
            <Input v-model:value="regRegion" placeholder="请输入所在地域" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" :loading="loading" block size="large" @click="handleRegister">
              注册
            </Button>
          </Form.Item>
        </Form>
        <Divider style="margin: 12px 0" />
        <Button type="link" block @click="isRegister = false">返回登录</Button>
      </div>
    </Card>
  </div>
</template>
