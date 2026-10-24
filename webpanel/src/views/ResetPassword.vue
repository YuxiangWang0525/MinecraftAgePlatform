<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Form, Input, Button, Card, message, Typography } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { resetPassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })

onMounted(() => {
  if (!authStore.mustResetPassword) {
    if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      router.push('/user/profile')
    }
  }
})

async function handleReset() {
  if (!form.oldPassword || !form.newPassword) {
    message.warning('请填写所有字段')
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }
  if (form.newPassword.length < 6) {
    message.error('新密码至少6位')
    return
  }
  loading.value = true
  try {
    await resetPassword({ oldPassword: form.oldPassword, newPassword: form.newPassword })
    authStore.updateUser({ mustResetPassword: false })
    message.success('密码重置成功')
    if (authStore.isAdmin) {
      router.push('/admin/dashboard')
    } else {
      router.push('/user/profile')
    }
  } catch (err: any) {
    message.error(err.response?.data?.message || '重置失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f2f5">
    <Card style="width: 400px; box-shadow: 0 2px 8px rgba(0,0,0,0.08)">
      <div style="text-align: center; margin-bottom: 24px">
        <Icon icon="mdi:lock-reset" style="font-size: 48px; color: #faad14" />
        <Typography.Title :level="3" style="margin-top: 12px; margin-bottom: 0">
          重置密码
        </Typography.Title>
        <Typography.Text type="warning">首次登录必须重置密码</Typography.Text>
      </div>
      <Form layout="vertical">
        <Form.Item label="原密码">
          <Input.Password v-model:value="form.oldPassword" placeholder="请输入原密码" size="large" />
        </Form.Item>
        <Form.Item label="新密码">
          <Input.Password v-model:value="form.newPassword" placeholder="请输入新密码(至少6位)" size="large" />
        </Form.Item>
        <Form.Item label="确认新密码">
          <Input.Password v-model:value="form.confirmPassword" placeholder="请再次输入新密码" size="large" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" :loading="loading" block size="large" @click="handleReset">
            确认重置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
