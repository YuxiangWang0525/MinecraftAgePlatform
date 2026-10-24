<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, Row, Col, Statistic, Typography, Spin, Form, Input, Button, message, Divider } from 'ant-design-vue'
import { Icon } from '@iconify/vue'
import { getUsers, getSiteSettings, setSiteSettings } from '@/api/admin'
import { useSiteSettingsStore } from '@/stores/siteSettings'

const loading = ref(false)
const totalUsers = ref(0)
const verifiedUsers = ref(0)
const minorUsers = ref(0)

// 站点设置
const siteSettingsStore = useSiteSettingsStore()
const siteForm = ref({ siteName: '', siteDescription: '' })
const siteSaving = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await getUsers()
    totalUsers.value = res.length
    verifiedUsers.value = res.filter((u: any) => u.isVerified).length
    minorUsers.value = res.filter((u: any) => u.isMinor).length

    // 加载站点设置
    const settings: any = await getSiteSettings()
    siteForm.value.siteName = settings.siteName || ''
    siteForm.value.siteDescription = settings.siteDescription || ''
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})

async function handleSaveSiteSettings() {
  siteSaving.value = true
  try {
    await setSiteSettings({
      siteName: siteForm.value.siteName,
      siteDescription: siteForm.value.siteDescription,
    })
    // 同步更新全局 store
    siteSettingsStore.update(siteForm.value.siteName, siteForm.value.siteDescription)
    message.success('站点设置已保存')
  } catch (err: any) {
    message.error(err.response?.data?.message || '保存失败')
  } finally {
    siteSaving.value = false
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <Typography.Title :level="4">
      <Icon icon="mdi:view-dashboard" style="margin-right: 8px" />
      仪表盘
    </Typography.Title>
    <Row :gutter="24" style="margin-bottom: 24px">
      <Col :span="8">
        <Card>
          <Statistic title="总用户数" :value="totalUsers">
            <template #prefix><Icon icon="mdi:account-group" style="color: #1677ff" /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic title="已认证用户" :value="verifiedUsers">
            <template #prefix><Icon icon="mdi:account-check" style="color: #52c41a" /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="8">
        <Card>
          <Statistic title="未成年用户" :value="minorUsers">
            <template #prefix><Icon icon="mdi:account-child" style="color: #faad14" /></template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <Card>
      <Typography.Title :level="5">
        <Icon icon="mdi:web" style="margin-right: 8px" />
        站点设置
      </Typography.Title>
      <div style="color: #666; font-size: 13px; margin-bottom: 16px">
        配置站点名称和描述，将显示在用户前台的侧边栏和登录页面
      </div>
      <Form layout="vertical" style="max-width: 500px">
        <Form.Item label="站点名称">
          <Input
            v-model:value="siteForm.siteName"
            placeholder="例如：MCAP 实名认证系统"
          />
        </Form.Item>
        <Form.Item label="站点描述">
          <Input
            v-model:value="siteForm.siteDescription"
            placeholder="可选，显示在登录页站点名称下方"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" :loading="siteSaving" @click="handleSaveSiteSettings">
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </Spin>
</template>
