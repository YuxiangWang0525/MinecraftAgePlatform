<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Card, Table, Tag, message, Spin, Tabs, Switch, Button, Modal, Input, InputNumber, Space, Alert, Typography, Form,
} from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import {
  getPlugins, getPluginLogs, setPluginEnabled, setPluginDescription, setPluginConfigValues,
  getVerifySettings, setVerifySettings,
} from '@/api/admin'

const loading = ref(false)
const plugins = ref<any[]>([])
const logs = ref<any[]>([])

// 认证熔断设置
const verifySettingsLoading = ref(false)
const maxAttempts = ref(5)
const verifySettingsSaved = ref(false)

// 编辑弹窗
const editModalVisible = ref(false)
const editModalLoading = ref(false)
const editingPlugin = ref<any>(null)
const editDescription = ref('')
const editConfigValues = reactive<Record<string, string>>({})

const pluginColumns = [
  { title: '插件名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '插件描述', dataIndex: 'pluginDescription', key: 'pluginDescription' },
  { title: '认证描述', dataIndex: 'description', key: 'description' },
  { title: '接口配置', key: 'configStatus', width: 110 },
  { title: '状态', dataIndex: 'enabled', key: 'enabled', width: 90 },
  { title: '操作', key: 'actions', width: 90 },
]

const logColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '插件名称', dataIndex: 'pluginName', key: 'pluginName' },
  { title: '人脸识别', dataIndex: 'isFaceScan', key: 'isFaceScan' },
  { title: '传入参数', dataIndex: 'inputParams', key: 'inputParams', ellipsis: true },
  { title: '返回结果', dataIndex: 'outputResult', key: 'outputResult', ellipsis: true },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
]

onMounted(async () => {
  await fetchData()
  await fetchVerifySettings()
})

async function fetchVerifySettings() {
  try {
    const res: any = await getVerifySettings()
    maxAttempts.value = res.maxAttempts
  } catch {
    // ignore
  }
}

async function handleSaveVerifySettings() {
  verifySettingsLoading.value = true
  try {
    await setVerifySettings(maxAttempts.value)
    message.success(maxAttempts.value === 0 ? '已关闭认证熔断' : '熔断阈值已保存')
    verifySettingsSaved.value = true
  } catch (err: any) {
    message.error(err.response?.data?.message || '保存失败')
  } finally {
    verifySettingsLoading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const pluginRes: any = await getPlugins()
    plugins.value = pluginRes
    const logRes: any = await getPluginLogs()
    logs.value = logRes
  } catch {
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

/** 获取 configSchema 中必填项的未完成列表 */
function getMissingRequiredConfigs(plugin: any): string[] {
  if (!plugin.configSchema || plugin.configSchema.length === 0) return []
  return plugin.configSchema
    .filter((item: any) => item.required && !plugin.configValues?.[item.key]?.trim())
    .map((item: any) => item.label)
}

async function handleToggleEnabled(plugin: any, checked: boolean) {
  try {
    if (checked) {
      const missing = getMissingRequiredConfigs(plugin)
      if (!plugin.description) {
        message.warning('请先设置认证描述再启用插件')
        openEditModal(plugin)
        return
      }
      if (missing.length > 0) {
        message.warning(`请先配置必填项：${missing.join('、')}`)
        openEditModal(plugin)
        return
      }
    }
    await setPluginEnabled(plugin.name, { enabled: checked })
    message.success(checked ? '插件已启用' : '插件已禁用')
    await fetchData()
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  }
}

function openEditModal(plugin: any) {
  editingPlugin.value = plugin
  editDescription.value = plugin.description || ''
  // 初始化配置值
  Object.keys(editConfigValues).forEach((k) => delete editConfigValues[k])
  if (plugin.configValues) {
    Object.assign(editConfigValues, plugin.configValues)
  }
  // 为 configSchema 中声明但尚未有值的字段设置空字符串
  if (plugin.configSchema) {
    for (const item of plugin.configSchema) {
      if (editConfigValues[item.key] === undefined) {
        editConfigValues[item.key] = ''
      }
    }
  }
  editModalVisible.value = true
}

async function handleSaveEdit() {
  if (!editDescription.value.trim()) {
    message.warning('请输入认证描述')
    return
  }
  editModalLoading.value = true
  try {
    // 保存认证描述
    await setPluginDescription(editingPlugin.value.name, { description: editDescription.value.trim() })
    // 保存接口配置值
    const configToSave: Record<string, string> = {}
    for (const [k, v] of Object.entries(editConfigValues)) {
      configToSave[k] = (v || '').trim()
    }
    await setPluginConfigValues(editingPlugin.value.name, { configValues: configToSave })
    message.success('已保存')
    editModalVisible.value = false
    await fetchData()
  } catch (err: any) {
    message.error(err.response?.data?.message || '保存失败')
  } finally {
    editModalLoading.value = false
  }
}

async function handleSaveAndEnable() {
  if (!editDescription.value.trim()) {
    message.warning('请输入认证描述')
    return
  }
  const missing = editingPlugin.value.configSchema
    ?.filter((item: any) => item.required && !editConfigValues[item.key]?.trim())
    .map((item: any) => item.label) || []
  if (missing.length > 0) {
    message.warning(`请填写必填配置项：${missing.join('、')}`)
    return
  }
  editModalLoading.value = true
  try {
    await setPluginEnabled(editingPlugin.value.name, {
      enabled: true,
      description: editDescription.value.trim(),
    })
    // 同时保存 configValues
    const configToSave: Record<string, string> = {}
    for (const [k, v] of Object.entries(editConfigValues)) {
      configToSave[k] = (v || '').trim()
    }
    await setPluginConfigValues(editingPlugin.value.name, { configValues: configToSave })
    message.success('插件已启用')
    editModalVisible.value = false
    await fetchData()
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败')
  } finally {
    editModalLoading.value = false
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:puzzle" />插件管理</Space>
      </template>

      <Tabs default-active-key="1">
        <Tabs.TabPane key="1" tab="已加载插件">
          <Table :columns="pluginColumns" :data-source="plugins" row-key="name" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'pluginDescription'">
                <div v-if="record.pluginDescription" style="font-size: 13px">
                  <span v-html="record.pluginDescription"></span>
                </div>
                <span v-else style="color: #999">未设置</span>
              </template>
              <template v-else-if="column.key === 'description'">
                <span v-if="record.description">{{ record.description }}</span>
                <span v-else style="color: #999">未设置</span>
              </template>
              <template v-else-if="column.key === 'configStatus'">
                <Tag v-if="!record.configSchema || record.configSchema.length === 0" color="default">
                  无需配置
                </Tag>
                <Tag
                  v-else-if="getMissingRequiredConfigs(record).length === 0"
                  color="green"
                >
                  已配置
                </Tag>
                <Tag v-else color="red">
                  待配置 ({{ getMissingRequiredConfigs(record).length }})
                </Tag>
              </template>
              <template v-else-if="column.key === 'enabled'">
                <Switch
                  :checked="record.enabled"
                  checked-children="启用"
                  un-checked-children="禁用"
                  @change="(checked: any) => handleToggleEnabled(record, !!checked)"
                />
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button size="small" @click="openEditModal(record)">
                  <template #icon><Icon icon="mdi:edit" /></template>
                  编辑
                </Button>
              </template>
            </template>
          </Table>
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="调用日志">
          <Table :columns="logColumns" :data-source="logs" row-key="id" :pagination="{ pageSize: 20 }" />
        </Tabs.TabPane>
        <Tabs.TabPane key="3" tab="认证设置">
          <Alert
            message="认证熔断说明"
            description="当用户实名认证失败次数达到设定阈值后，该用户将被锁定，无法继续认证。管理员可在用户管理中手动解除锁定。设为 0 表示不限制失败次数。"
            type="info"
            show-icon
            style="margin-bottom: 20px"
          />
          <Form layout="vertical" style="max-width: 400px">
            <Form.Item label="认证失败次数上限（0 = 不限制）">
              <InputNumber
                v-model:value="maxAttempts"
                :min="0"
                :max="100"
                style="width: 100%"
                placeholder="默认 5 次"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" :loading="verifySettingsLoading" @click="handleSaveVerifySettings">
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Spin>

  <!-- 编辑插件弹窗 -->
  <Modal
    v-model:open="editModalVisible"
    :title="`插件配置 - ${editingPlugin?.name}`"
    :confirm-loading="editModalLoading"
    :width="560"
    @ok="handleSaveEdit"
    ok-text="保存"
    cancel-text="取消"
  >
    <!-- 插件描述（只读展示） -->
    <div v-if="editingPlugin?.pluginDescription" style="margin-bottom: 16px">
      <Alert type="info" show-icon>
        <template #message>
          <span style="font-size: 13px" v-html="editingPlugin.pluginDescription"></span>
        </template>
      </Alert>
    </div>

    <!-- 认证描述（管理员编辑） -->
    <div style="margin-bottom: 16px">
      <Typography.Title :level="5" style="margin-bottom: 8px">
        <Icon icon="mdi:text-box" style="margin-right: 6px" />认证描述
      </Typography.Title>
      <div style="color: #666; font-size: 13px; margin-bottom: 8px">
        面向用户展示，说明该认证方式接受的证件类型，如：身份证、护照、港澳通行证等
      </div>
      <Input.TextArea
        v-model:value="editDescription"
        :rows="2"
        placeholder="例如：本认证方式接受中华人民共和国居民身份证"
      />
    </div>

    <!-- 接口配置项（动态渲染） -->
    <div v-if="editingPlugin?.configSchema?.length > 0">
      <Typography.Title :level="5" style="margin-bottom: 8px">
        <Icon icon="mdi:cog" style="margin-right: 6px" />接口配置
      </Typography.Title>
      <div style="color: #666; font-size: 13px; margin-bottom: 12px">
        由插件声明的配置项，请根据插件文档填写对应的 API 密钥或参数
      </div>
      <div v-for="item in editingPlugin.configSchema" :key="item.key" style="margin-bottom: 14px">
        <div style="margin-bottom: 4px">
          <Typography.Text strong>{{ item.label }}</Typography.Text>
          <Tag v-if="item.required" color="red" style="margin-left: 6px">必填</Tag>
        </div>
        <div v-if="item.description" style="color: #999; font-size: 12px; margin-bottom: 4px">
          {{ item.description }}
        </div>
        <Input
          v-if="item.type === 'password'"
          v-model:value="editConfigValues[item.key]"
          :placeholder="item.placeholder || `请输入 ${item.label}`"
          type="password"
        />
        <Input.TextArea
          v-else-if="item.type === 'textarea'"
          v-model:value="editConfigValues[item.key]"
          :placeholder="item.placeholder || `请输入 ${item.label}`"
          :rows="2"
        />
        <Input
          v-else
          v-model:value="editConfigValues[item.key]"
          :placeholder="item.placeholder || `请输入 ${item.label}`"
        />
      </div>
    </div>

    <!-- 启用按钮（当前为禁用状态时显示） -->
    <div v-if="editingPlugin?.enabled === false" style="margin-top: 16px; text-align: right">
      <Button type="primary" :loading="editModalLoading" @click="handleSaveAndEnable">
        保存并启用插件
      </Button>
    </div>
  </Modal>
</template>
