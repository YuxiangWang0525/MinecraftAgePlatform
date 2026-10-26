<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { Card, Descriptions, Tag, Button, Select, Switch, Form, message, Spin, Space, Typography, Popconfirm, Divider } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserById, updateUserAge, unlockUserVerify, revokeUserVerify } from '@/api/admin'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const user = ref<any>(null)
const form = reactive({ ageRange: '', isMinor: false })

const ageOptions = ['4+', '8+', '12+', '16+', '18+']

onMounted(async () => {
  loading.value = true
  try {
    const id = Number(route.params.id)
    const res: any = await getUserById(id)
    user.value = res
    form.ageRange = res.ageRange
    form.isMinor = res.isMinor
  } catch {
    message.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  saving.value = true
  try {
    await updateUserAge(user.value.id, { ageRange: form.ageRange, isMinor: form.isMinor })
    message.success('更新成功')
    const res: any = await getUserById(user.value.id)
    user.value = res
  } catch (err: any) {
    message.error(err.response?.data?.message || '更新失败')
  } finally {
    saving.value = false
  }
}

async function handleUnlock() {
  try {
    await unlockUserVerify(user.value.id)
    message.success('已解除认证锁定，失败计数已重置')
    const res: any = await getUserById(user.value.id)
    user.value = res
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  }
}

async function handleRevoke() {
  try {
    await revokeUserVerify(user.value.id)
    message.success('已取消该用户的实名认证')
    const res: any = await getUserById(user.value.id)
    user.value = res
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Card v-if="user">
      <template #title>
        <Space><Icon icon="mdi:account-details" />用户详情 - {{ user.username }}</Space>
      </template>
      <template #extra>
        <Button @click="router.back()">
          <Icon icon="mdi:arrow-left" /> 返回
        </Button>
      </template>

      <Descriptions :column="2" bordered style="margin-bottom: 24px">
        <Descriptions.Item label="ID">{{ user.id }}</Descriptions.Item>
        <Descriptions.Item label="用户名">{{ user.username }}</Descriptions.Item>
        <Descriptions.Item label="地域">{{ user.region || '未设置' }}</Descriptions.Item>
        <Descriptions.Item label="角色">
          <Tag :color="user.role === 'super_admin' ? 'red' : user.role === 'admin' ? 'blue' : 'default'">
            {{ user.role }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="实名认证">
          <Tag :color="user.isVerified ? 'green' : 'default'">{{ user.isVerified ? '已认证' : '未认证' }}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="注册时间">{{ user.createdAt }}</Descriptions.Item>
        <Descriptions.Item label="认证熔断状态">
          <Tag v-if="user.verifyLocked" color="red">
            <Icon icon="mdi:lock" style="margin-right: 4px" />已锁定
          </Tag>
          <Tag v-else-if="user.verifyAttempts > 0" color="orange">
            警告 ({{ user.verifyAttempts }}次失败)
          </Tag>
          <Tag v-else color="green">正常</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="失败次数">{{ user.verifyAttempts }}</Descriptions.Item>
      </Descriptions>

      <!-- 认证管理 -->
      <div v-if="user.isVerified || user.verifyLocked || user.verifyAttempts > 0" style="margin-bottom: 24px">
        <Typography.Title :level="5">
          <Icon icon="mdi:shield-account" style="margin-right: 6px" />认证管理
        </Typography.Title>
        <Space>
          <Popconfirm
            v-if="user.verifyLocked"
            title="确认解除该用户的认证锁定？失败计数将被重置，用户可重新进行认证。"
            @confirm="handleUnlock"
          >
            <Button type="primary" style="background: #faad14; border-color: #faad14">
              <Icon icon="mdi:lock-open" /> 解除锁定并重置计数
            </Button>
          </Popconfirm>
          <Popconfirm
            v-if="user.isVerified"
            title="确认取消该用户的实名认证？此操作将清除所有认证信息（姓名、证件号、出生日期），用户需要重新进行认证。"
            ok-text="确认取消"
            ok-type="danger"
            @confirm="handleRevoke"
          >
            <Button danger>
              <Icon icon="mdi:account-remove" /> 取消实名认证
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Divider />

      <Typography.Title :level="5">修改年龄信息</Typography.Title>
      <Form layout="vertical" style="max-width: 400px">
        <Form.Item label="年龄段">
          <Select v-model:value="form.ageRange">
            <Select.Option v-for="opt in ageOptions" :key="opt" :value="opt">{{ opt }}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="是否未成年">
          <Switch v-model:checked="form.isMinor" checked-children="是" un-checked-children="否" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" :loading="saving" @click="handleSave">保存修改</Button>
        </Form.Item>
      </Form>
    </Card>
  </Spin>
</template>
