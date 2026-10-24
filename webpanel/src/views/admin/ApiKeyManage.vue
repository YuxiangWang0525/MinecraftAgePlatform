<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Card, Table, Button, message, Spin, Switch, Modal, Input, Space, Typography, Alert,
} from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import {
  getApiKeys, createApiKey, toggleApiKey, regenerateApiKey, deleteApiKey,
} from '@/api/admin'

const loading = ref(false)
const apiKeys = ref<any[]>([])
const createModalVisible = ref(false)
const createLoading = ref(false)
const newKeyName = ref('')

// 新创建的 Key 展示弹窗
const showKeyModalVisible = ref(false)
const createdKey = ref('')
const createdKeyName = ref('')

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: 'API Key', dataIndex: 'key', key: 'key' },
  { title: '状态', dataIndex: 'isActive', key: 'isActive', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 240 },
]

onMounted(async () => {
  await fetchApiKeys()
})

async function fetchApiKeys() {
  loading.value = true
  try {
    const res: any = await getApiKeys()
    apiKeys.value = res
  } catch {
    message.error('获取 API Key 列表失败')
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newKeyName.value = ''
  createModalVisible.value = true
}

async function handleCreate() {
  if (!newKeyName.value.trim()) {
    message.warning('请输入 API Key 名称')
    return
  }
  createLoading.value = true
  try {
    const res: any = await createApiKey({ name: newKeyName.value.trim() })
    createModalVisible.value = false
    // 展示新创建的 Key
    createdKey.value = res.key
    createdKeyName.value = res.name
    showKeyModalVisible.value = true
    await fetchApiKeys()
  } catch (err: any) {
    message.error(err.response?.data?.message || '创建失败')
  } finally {
    createLoading.value = false
  }
}

async function handleToggle(record: any, checked: boolean) {
  try {
    await toggleApiKey(record.id, checked)
    message.success(checked ? '已启用' : '已禁用')
    await fetchApiKeys()
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  }
}

function handleRegenerate(record: any) {
  Modal.confirm({
    title: '重新生成 API Key',
    content: `确定要重新生成「${record.name}」的 API Key 吗？旧 Key 将立即失效。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res: any = await regenerateApiKey(record.id)
        createdKey.value = res.key
        createdKeyName.value = res.name
        showKeyModalVisible.value = true
        await fetchApiKeys()
      } catch (err: any) {
        message.error(err.response?.data?.message || '重新生成失败')
      }
    },
  })
}

function handleDelete(record: any) {
  Modal.confirm({
    title: '删除 API Key',
    content: `确定要删除「${record.name}」吗？此操作不可恢复。`,
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteApiKey(record.id)
        message.success('已删除')
        await fetchApiKeys()
      } catch (err: any) {
        message.error(err.response?.data?.message || '删除失败')
      }
    },
  })
}

function formatTime(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

function maskKey(key: string) {
  if (!key || key.length <= 12) return key
  return key.slice(0, 8) + '••••••••' + key.slice(-4)
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:key-variant" />API Key 管理</Space>
      </template>
      <template #extra>
        <Button type="primary" @click="openCreateModal">
          <template #icon><Icon icon="mdi:plus" /></template>
          创建 API Key
        </Button>
      </template>

      <Table :columns="columns" :data-source="apiKeys" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'key'">
            <Typography.Text copyable :content="record.key" style="font-family: monospace">
              <code>{{ maskKey(record.key) }}</code>
            </Typography.Text>
          </template>
          <template v-else-if="column.key === 'isActive'">
            <Switch
              :checked="record.isActive"
              checked-children="启用"
              un-checked-children="禁用"
              @change="(checked: any) => handleToggle(record, !!checked)"
            />
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatTime(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="handleRegenerate(record)">
                <Icon icon="mdi:refresh" /> 重新生成
              </Button>
              <Button size="small" type="link" danger @click="handleDelete(record)">
                <Icon icon="mdi:delete" /> 删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </Spin>

  <!-- 创建 API Key 弹窗 -->
  <Modal
    v-model:open="createModalVisible"
    title="创建 API Key"
    :confirm-loading="createLoading"
    @ok="handleCreate"
    ok-text="创建"
    cancel-text="取消"
  >
    <div style="margin-bottom: 12px">
      为该 API Key 起一个名称，以便识别其用途（如：游戏服务器A、测试环境等）
    </div>
    <Input
      v-model:value="newKeyName"
      placeholder="请输入 API Key 名称"
      @pressEnter="handleCreate"
    />
  </Modal>

  <!-- 展示新创建的 Key 弹窗 -->
  <Modal
    v-model:open="showKeyModalVisible"
    :title="`API Key ${createdKeyName}`"
    :footer="null"
    :width="560"
  >
    <Alert
      message="请妥善保存此 API Key，关闭后将无法再次查看完整内容。"
      type="warning"
      show-icon
      style="margin-bottom: 16px"
    />
    <Input
      :value="createdKey"
      readonly
      style="font-family: monospace; font-size: 14px"
    >
      <template #prefix><Icon icon="mdi:key" /></template>
      <template #suffix>
        <Typography.Text copyable :content="createdKey" />
      </template>
    </Input>
    <div style="margin-top: 16px; text-align: right">
      <Button type="primary" @click="showKeyModalVisible = false">我已保存，关闭</Button>
    </div>
  </Modal>
</template>
