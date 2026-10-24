<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Card, Form, Input, Button, Select, message, Alert, Spin, Tag, Space } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { verifyIdentity, getProfile, getEnabledPlugins, getVerifyStatus } from '@/api/user'

const loading = ref(false)
const submitting = ref(false)
const profile = ref<any>(null)
const plugins = ref<any[]>([])
const verifyStatus = ref<any>(null)
const form = reactive({ realName: '', idNumber: '', pluginName: '' })

const selectedPlugin = computed(() => plugins.value.find((p) => p.name === form.pluginName) || null)
const isLocked = computed(() => verifyStatus.value?.verifyLocked === true)

onMounted(async () => {
  loading.value = true
  try {
    profile.value = await getProfile()
    const res: any = await getEnabledPlugins()
    plugins.value = res
    if (plugins.value.length > 0) {
      form.pluginName = plugins.value[0].name
    }
    // 获取熔断状态
    verifyStatus.value = await getVerifyStatus()
  } catch {
    message.error('获取信息失败')
  } finally {
    loading.value = false
  }
})

async function refreshVerifyStatus() {
  try {
    verifyStatus.value = await getVerifyStatus()
  } catch {
    // ignore
  }
}

async function handleSubmit() {
  if (!form.realName || !form.idNumber) {
    message.warning('请填写姓名和身份证号')
    return
  }
  submitting.value = true
  try {
    const res: any = await verifyIdentity({
      realName: form.realName,
      idNumber: form.idNumber,
      pluginName: form.pluginName || undefined,
    })

    if (res['qr-data']) {
      message.info(res.message || '请扫描二维码完成人脸识别')
      Alert.info({ message: '人脸识别', description: `QR Data: ${res['qr-data']}` })
    } else if (res.success === false) {
      // 认证失败但未被锁定
      message.warning(res.message || '认证失败')
    } else {
      message.success(res.message || '实名认证成功')
      // 显示年龄段信息
      if (res.birthDate) {
        const ageInfo = res.isAdult ? '成年' : '未成年'
        message.info(`已根据出生年月(${res.birthDate})设置为${ageInfo}用户`)
      }
      profile.value = await getProfile()
    }
    // 刷新熔断状态
    await refreshVerifyStatus()
  } catch (err: any) {
    message.error(err.response?.data?.message || '认证失败')
    // 刷新熔断状态（可能因锁定被拒绝）
    await refreshVerifyStatus()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:card-account-details" />实名认证</Space>
      </template>

      <Alert
        v-if="profile?.isVerified"
        message="您已完成实名认证"
        type="success"
        show-icon
        style="margin-bottom: 24px"
      />

      <Alert
        v-if="isLocked && !profile?.isVerified"
        message="认证已被锁定"
        description="您的认证失败次数已达上限，无法继续认证。请联系管理员解除锁定。"
        type="error"
        show-icon
        style="margin-bottom: 24px"
      />

      <Alert
        v-if="!isLocked && !profile?.isVerified && verifyStatus?.remaining !== null && verifyStatus.remaining !== undefined"
        :message="`剩余认证机会：${verifyStatus.remaining} / ${verifyStatus.maxAttempts} 次`"
        type="warning"
        show-icon
        style="margin-bottom: 16px"
      />

      <Form layout="vertical" style="max-width: 500px">
        <Form.Item label="认证方式" v-if="plugins.length > 0">
          <Select v-model:value="form.pluginName" placeholder="选择认证方式">
            <Select.Option v-for="p in plugins" :key="p.name" :value="p.name">
              {{ p.description || p.name }}
              <Tag v-if="p.is_face_scan" color="orange" style="margin-left: 8px">人脸识别</Tag>
            </Select.Option>
          </Select>
          <div v-if="selectedPlugin?.pluginDescription" style="margin-top: 8px; color: #1677ff; font-size: 13px">
            <Icon icon="mdi:information-outline" style="margin-right: 4px" />
            <span v-html="selectedPlugin.pluginDescription"></span>
          </div>
          <div v-if="selectedPlugin?.description" style="margin-top: 4px; color: #666; font-size: 13px">
            <Icon icon="mdi:file-document-outline" style="margin-right: 4px" />
            {{ selectedPlugin.description }}
          </div>
        </Form.Item>

        <Form.Item label="真实姓名">
          <Input v-model:value="form.realName" placeholder="请输入真实姓名">
            <template #prefix><Icon icon="mdi:account" /></template>
          </Input>
        </Form.Item>

        <Form.Item label="身份证号码">
          <Input v-model:value="form.idNumber" placeholder="请输入身份证号码" :maxlength="18">
            <template #prefix><Icon icon="mdi:card-bulleted" /></template>
          </Input>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            :loading="submitting"
            :disabled="profile?.isVerified || isLocked"
            @click="handleSubmit"
          >
            提交认证
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </Spin>
</template>
