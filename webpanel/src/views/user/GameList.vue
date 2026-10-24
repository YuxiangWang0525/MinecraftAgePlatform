<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, Table, Button, message, Spin, Input, Space, Empty } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { getUserGameAccounts, updateGameAccountRemark } from '@/api/user'

const loading = ref(false)
const games = ref<any[]>([])
const editingId = ref<number | null>(null)
const editRemark = ref('')
const saving = ref(false)

const columns = [
  { title: '游戏UID', dataIndex: 'uid', key: 'uid' },
  { title: '游戏名称', dataIndex: 'gameName', key: 'gameName' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '绑定时间', dataIndex: 'boundAt', key: 'boundAt' },
  { title: '操作', key: 'actions', width: 120 },
]

onMounted(async () => {
  await fetchGames()
})

async function fetchGames() {
  loading.value = true
  try {
    const res: any = await getUserGameAccounts()
    games.value = res
  } catch {
    message.error('获取游戏列表失败')
  } finally {
    loading.value = false
  }
}

function startEdit(record: any) {
  editingId.value = record.id
  editRemark.value = record.remark || ''
}

async function saveRemark(record: any) {
  saving.value = true
  try {
    await updateGameAccountRemark(record.id, editRemark.value)
    record.remark = editRemark.value
    editingId.value = null
    message.success('备注已保存')
  } catch (err: any) {
    message.error(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  editingId.value = null
  editRemark.value = ''
}

function formatBoundAt(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:gamepad-variant" />已绑定游戏</Space>
      </template>

      <Table
        :columns="columns"
        :data-source="games"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'uid'">
            <code style="font-weight: 600">{{ record.uid }}</code>
          </template>
          <template v-else-if="column.key === 'gameName'">
            <span v-if="record.gameName">{{ record.gameName }}</span>
            <span v-else style="color: #999">未提供</span>
          </template>
          <template v-else-if="column.key === 'remark'">
            <template v-if="editingId === record.id">
              <Space>
                <Input
                  v-model:value="editRemark"
                  placeholder="输入备注"
                  size="small"
                  style="width: 200px"
                  @pressEnter="saveRemark(record)"
                />
                <Button size="small" type="primary" :loading="saving" @click="saveRemark(record)">保存</Button>
                <Button size="small" @click="cancelEdit">取消</Button>
              </Space>
            </template>
            <template v-else>
              <span v-if="record.remark">{{ record.remark }}</span>
              <span v-else style="color: #999">无备注</span>
            </template>
          </template>
          <template v-else-if="column.key === 'boundAt'">
            {{ formatBoundAt(record.boundAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              v-if="editingId !== record.id"
              size="small"
              type="link"
              @click="startEdit(record)"
            >
              <template #icon><Icon icon="mdi:edit" /></template>
              编辑备注
            </Button>
          </template>
        </template>

        <template #emptyText>
          <Empty description="暂无已绑定的游戏账号" />
        </template>
      </Table>
    </Card>
  </Spin>
</template>
