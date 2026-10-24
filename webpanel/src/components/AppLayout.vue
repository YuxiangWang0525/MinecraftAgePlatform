<script setup lang="ts">
import { Layout, Menu } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { useSiteSettingsStore } from '@/stores/siteSettings';
import AppHeader from './AppHeader.vue';

const { Sider, Content } = Layout;
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const siteSettings = useSiteSettingsStore();

const selectedKeys = [route.path];

function handleMenuClick(info: any) {
  router.push(String(info.key));
}
</script>

<template>
  <Layout style="min-height: 100vh">
    <Sider
      theme="light"
      :width="240"
      style="box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06)"
    >
      <div
        style="
          padding: 20px 24px;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
          border-bottom: 1px solid #f0f0f0;
        "
      >
        <p v-if="authStore.isAdmin">MCAP 管理面板</p>
        <p v-else>{{ siteSettings.displayName }}</p>
      </div>
      <Menu
        mode="inline"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
        style="border-right: none"
      >
        <template v-if="authStore.isAdmin">
          <Menu.Item key="/admin/dashboard">
            <Icon icon="mdi:view-dashboard" style="margin-right: 8px" />
            仪表盘
          </Menu.Item>
          <Menu.Item key="/admin/users">
            <Icon icon="mdi:account-group" style="margin-right: 8px" />
            用户管理
          </Menu.Item>
          <Menu.Item key="/admin/create-admin">
            <Icon icon="mdi:account-plus" style="margin-right: 8px" />
            创建管理员
          </Menu.Item>
          <Menu.Item key="/admin/plugins">
            <Icon icon="mdi:puzzle" style="margin-right: 8px" />
            插件管理
          </Menu.Item>
          <Menu.Item key="/admin/api-keys">
            <Icon icon="mdi:key-variant" style="margin-right: 8px" />
            API Key 管理
          </Menu.Item>
        </template>
        <template v-else>
          <Menu.Item key="/user/profile">
            <Icon icon="mdi:account" style="margin-right: 8px" />
            个人信息
          </Menu.Item>
          <Menu.Item key="/user/verify">
            <Icon icon="mdi:card-account-details" style="margin-right: 8px" />
            实名认证
          </Menu.Item>
          <Menu.Item key="/user/bind-game">
            <Icon icon="mdi:gamepad-variant" style="margin-right: 8px" />
            绑定游戏账号
          </Menu.Item>
          <Menu.Item key="/user/game-list">
            <Icon icon="mdi:format-list-bulleted" style="margin-right: 8px" />
            已绑定游戏
          </Menu.Item>
        </template>
      </Menu>
    </Sider>
    <Layout>
      <AppHeader />
      <Content style="padding: 24px; background: #f5f5f5">
        <div style="min-height: calc(100vh - 64px)">
          <router-view />
        </div>
      </Content>
    </Layout>
  </Layout>
</template>
