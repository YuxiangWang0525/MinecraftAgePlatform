<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Card, Form, Input, Button, Descriptions, Tag, message, Spin, Typography } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { getProfile, updateProfile } from '@/api/user'

const loading = ref(false)
const saving = ref(false)
const profile = ref<any>(null)
const editing = ref(false)
const form = reactive({ username: '', region: '' })

onMounted(async () => {
  await fetchProfile()
})

async function fetchProfile() {
  loading.value = true
  try {
    profile.value = await getProfile()
    form.username = profile.value.username
    form.region = profile.value.region || ''
  } catch (err: any) {
    message.error('获取信息失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateProfile({ username: form.username, region: form.region })
    message.success('更新成功')
    editing.value = false
    await fetchProfile()
  } catch (err: any) {
    message.error(err.response?.data?.message || '更新失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:account" />个人信息</Space>
      </template>
      <template #extra v-if="!editing">
        <Button type="primary" @click="editing = true">
          <template #icon><Icon icon="mdi:pencil" /></template>
          编辑
        </Button>
      </template>

      <template v-if="profile && !editing">
        <Descriptions :column="1" bordered>
          <Descriptions.Item label="用户名">{{ profile.username }}</Descriptions.Item>
          <Descriptions.Item label="所在地域">{{ profile.region || '未设置' }}</Descriptions.Item>
          <Descriptions.Item label="实名认证">
            <Tag :color="profile.isVerified ? 'green' : 'default'">
              {{ profile.isVerified ? '已认证' : '未认证' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="是否未成年">
            <Tag :color="profile.isMinor ? 'orange' : 'green'">
              {{ profile.isMinor ? '是' : '否' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="年龄段">
            <Tag color="blue">{{ profile.ageRange }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="角色">
            <Tag>{{ profile.role }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">{{ profile.createdAt }}</Descriptions.Item>
        </Descriptions>
      </template>

      <Form v-else layout="vertical" style="max-width: 400px">
        <Form.Item label="用户名">
          <Input v-model:value="form.username" placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item label="所在地域">
          <Input v-model:value="form.region" placeholder="请输入所在地域" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" :loading="saving" @click="handleSave">保存</Button>
            <Button @click="editing = false">取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  </Spin>
</template>
