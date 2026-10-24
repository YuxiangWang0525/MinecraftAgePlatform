<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Card, Form, Input, Button, message, Typography } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { createAdmin } from '@/api/admin'

const loading = ref(false)
const form = reactive({ username: '', password: '', confirmPassword: '' })

async function handleCreate() {
  if (!form.username || !form.password) {
    message.warning('请填写所有字段')
    return
  }
  if (form.password !== form.confirmPassword) {
    message.error('两次密码不一致')
    return
  }
  if (form.password.length < 6) {
    message.error('密码至少6位')
    return
  }
  loading.value = true
  try {
    await createAdmin({ username: form.username, password: form.password })
    message.success('管理员创建成功')
    form.username = ''
    form.password = ''
    form.confirmPassword = ''
  } catch (err: any) {
    message.error(err.response?.data?.message || '创建失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Card>
    <template #title>
      <Space><Icon icon="mdi:account-plus" />创建管理员</Space>
    </template>

    <Form layout="vertical" style="max-width: 400px">
      <Form.Item label="用户名">
        <Input v-model:value="form.username" placeholder="请输入管理员用户名">
          <template #prefix><Icon icon="mdi:account" /></template>
        </Input>
      </Form.Item>
      <Form.Item label="密码">
        <Input.Password v-model:value="form.password" placeholder="请输入密码(至少6位)">
          <template #prefix><Icon icon="mdi:lock" /></template>
        </Input.Password>
      </Form.Item>
      <Form.Item label="确认密码">
        <Input.Password v-model:value="form.confirmPassword" placeholder="请再次输入密码">
          <template #prefix><Icon icon="mdi:lock-check" /></template>
        </Input.Password>
      </Form.Item>
      <Form.Item>
        <Button type="primary" :loading="loading" @click="handleCreate">
          创建管理员
        </Button>
      </Form.Item>
    </Form>
  </Card>
</template>
