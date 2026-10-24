import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
    },
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/views/AdminLogin.vue'),
    },
    {
      path: '/admin/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/ResetPassword.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: 'profile',
          name: 'UserProfile',
          component: () => import('@/views/user/Profile.vue'),
        },
        {
          path: 'verify',
          name: 'UserVerify',
          component: () => import('@/views/user/Verify.vue'),
        },
        {
          path: 'bind-game',
          name: 'BindGame',
          component: () => import('@/views/user/BindGame.vue'),
        },
        {
          path: 'game-list',
          name: 'GameList',
          component: () => import('@/views/user/GameList.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/components/AppLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/admin/Dashboard.vue'),
        },
        {
          path: 'users',
          name: 'UserList',
          component: () => import('@/views/admin/UserList.vue'),
        },
        {
          path: 'users/:id',
          name: 'UserDetail',
          component: () => import('@/views/admin/UserDetail.vue'),
        },
        {
          path: 'create-admin',
          name: 'CreateAdmin',
          component: () => import('@/views/admin/CreateAdmin.vue'),
        },
        {
          path: 'plugins',
          name: 'PluginList',
          component: () => import('@/views/admin/PluginList.vue'),
        },
        {
          path: 'api-keys',
          name: 'ApiKeyManage',
          component: () => import('@/views/admin/ApiKeyManage.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (authStore.mustResetPassword && to.path !== '/admin/reset-password') {
    return '/admin/reset-password'
  }

  return true
})

export default router
