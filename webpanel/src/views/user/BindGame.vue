<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, Form, Input, Button, message, Typography, Alert, Spin, Descriptions, Space } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { useRoute } from 'vue-router'
import { bindGameAccount, getBindCodeInfo } from '@/api/user'

const route = useRoute()
const bindCode = ref((route.query.code as string) || '')
const uid = ref((route.query.uid as string) || '')
const gameName = ref((route.query.gameName as string) || '')
const remark = ref('')
const loading = ref(false)
const submitting = ref(false)
const success = ref(false)
const codeValid = ref(false)

onMounted(async () => {
  // 如果 URL 中有绑定码但没有 UID，通过接口查询
  if (bindCode.value && !uid.value) {
    await fetchBindCodeInfo()
  } else if (bindCode.value && uid.value) {
    codeValid.value = true
  }
})

async function fetchBindCodeInfo() {
  if (!bindCode.value) return
  loading.value = true
  try {
    const info: any = await getBindCodeInfo(bindCode.value)
    uid.value = info.uid
    if (info.gameName) {
      gameName.value = info.gameName
    }
    codeValid.value = true
  } catch (err: any) {
    message.error(err.response?.data?.message || '绑定码无效或已过期')
    codeValid.value = false
  } finally {
    loading.value = false
  }
}

async function handleBind() {
  if (!bindCode.value) {
    message.warning('请输入绑定码')
    return
  }
  submitting.value = true
  try {
    await bindGameAccount({
      bindCode: bindCode.value,
      remark: remark.value || undefined,
    })
    success.value = true
    message.success('绑定成功')
  } catch (err: any) {
    message.error(err.response?.data?.message || '绑定失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Card>
      <template #title>
        <Space><Icon icon="mdi:gamepad-variant" />绑定游戏账号</Space>
      </template>

      <Alert
        v-if="success"
        message="绑定成功"
        :description="`游戏UID ${uid} 已成功绑定到当前用户`"
        type="success"
        show-icon
        style="margin-bottom: 16px"
      />

      <Typography.Paragraph type="secondary">
        请确认以下游戏账号信息并完成绑定。绑定码为循环使用的一次性令牌，绑定完成后自动释放回待用池。
      </Typography.Paragraph>

      <!-- 游戏账号信息展示 -->
      <Descriptions
        v-if="uid"
        bordered
        :column="1"
        style="max-width: 500px; margin-bottom: 24px"
      >
        <Descriptions.Item label="游戏UID">
          <strong>{{ uid }}</strong>
        </Descriptions.Item>
        <Descriptions.Item v-if="gameName" label="游戏名称">
          {{ gameName }}
        </Descriptions.Item>
      </Descriptions>

      <Alert
        v-else-if="!loading && bindCode && !codeValid"
        message="绑定码无效"
        description="该绑定码无效或已过期，请向游戏服务端重新获取。"
        type="error"
        show-icon
        style="margin-bottom: 16px"
      />

      <Form layout="vertical" style="max-width: 500px">
        <Form.Item label="绑定码">
          <Input
            v-model:value="bindCode"
            placeholder="请输入8位绑定码"
            :maxlength="8"
            :disabled="success || (codeValid && !!uid)"
          >
            <template #prefix><Icon icon="mdi:key" /></template>
          </Input>
        </Form.Item>

        <Form.Item label="备注（可选）">
          <Input
            v-model:value="remark"
            placeholder="为该游戏账号添加备注，方便识别"
            :disabled="success"
          >
            <template #prefix><Icon icon="mdi:label-outline" /></template>
          </Input>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            :loading="submitting"
            :disabled="success || !bindCode"
            @click="handleBind"
          >
            确认绑定
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </Spin>
</template>
