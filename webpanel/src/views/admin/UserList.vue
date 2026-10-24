<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Table, Card, Button, Tag, Space, Typography, message, Popconfirm } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { getUsers, deleteUser, unlockUserVerify } from '@/api/admin'

const router = useRouter()
const loading = ref(false)
const users = ref<any[]>([])

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '地域', dataIndex: 'region', key: 'region' },
  { title: '实名认证', dataIndex: 'isVerified', key: 'isVerified', width: 100 },
  { title: '认证熔断', key: 'verifyLocked', width: 120 },
  { title: '未成年', dataIndex: 'isMinor', key: 'isMinor', width: 80 },
  { title: '年龄段', dataIndex: 'ageRange', key: 'ageRange', width: 80 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 100 },
  { title: '操作', key: 'action', width: 240 },
]

onMounted(async () => {
  await fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const res: any = await getUsers()
    users.value = res
  } catch {
    message.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await deleteUser(id)
    message.success('删除成功')
    await fetchUsers()
  } catch (err: any) {
    message.error(err.response?.data?.message || '删除失败')
  }
}

async function handleUnlock(userId: number) {
  try {
    await unlockUserVerify(userId)
    message.success('已解除认证锁定')
    await fetchUsers()
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  }
}
</script>

<template>
  <Card>
    <template #title>
      <Space><Icon icon="mdi:account-group" />用户管理</Space>
    </template>
    <Table
      :columns="columns"
      :data-source="users"
      :loading="loading"
      row-key="id"
      :pagination="{ pageSize: 20 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'isVerified'">
          <Tag :color="record.isVerified ? 'green' : 'default'">
            {{ record.isVerified ? '已认证' : '未认证' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'verifyLocked'">
          <Tag v-if="record.verifyLocked" color="red">
            <Icon icon="mdi:lock" style="margin-right: 4px" />已锁定 ({{ record.verifyAttempts }}次)
          </Tag>
          <Tag v-else-if="record.verifyAttempts > 0" color="orange">
            {{ record.verifyAttempts }}次失败
          </Tag>
          <Tag v-else color="green">正常</Tag>
        </template>
        <template v-else-if="column.key === 'isMinor'">
          <Tag :color="record.isMinor ? 'orange' : 'green'">
            {{ record.isMinor ? '是' : '否' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'ageRange'">
          <Tag color="blue">{{ record.ageRange }}</Tag>
        </template>
        <template v-else-if="column.key === 'role'">
          <Tag :color="record.role === 'super_admin' ? 'red' : record.role === 'admin' ? 'blue' : 'default'">
            {{ record.role === 'super_admin' ? '超级管理员' : record.role === 'admin' ? '管理员' : '用户' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <Space>
            <Button type="link" size="small" @click="router.push(`/admin/users/${record.id}`)">
              <Icon icon="mdi:eye" /> 详情
            </Button>
            <Popconfirm
              v-if="record.verifyLocked"
              title="确认解除该用户的认证锁定？失败计数将被重置。"
              @confirm="handleUnlock(record.id)"
            >
              <Button type="link" size="small" style="color: #faad14">
                <Icon icon="mdi:lock-open" /> 解锁
              </Button>
            </Popconfirm>
            <Popconfirm
              v-if="record.role !== 'super_admin'"
              title="确认删除该用户？"
              @confirm="handleDelete(record.id)"
            >
              <Button type="link" size="small" danger>
                <Icon icon="mdi:delete" /> 删除
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>
  </Card>
</template>
