import { createRouter, createWebHistory } from 'vue-router'
import { authenticatedHomeTarget, selectedLanguagePairSlugFromUser } from '@/utils/account-routing'
import { useAccountStore } from '@/stores/account'
import DashboardView from '@/views/DashboardView.vue'
import CollectionDetailView from '@/views/CollectionDetailView.vue'
import HomeView from '@/views/HomeView.vue'
import LanguagePairSelectView from '@/views/LanguagePairSelectView.vue'
import LoginView from '@/views/LoginView.vue'
import SignUpView from '@/views/SignUpView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return new Promise((resolve) => {
        window.setTimeout(() => resolve(savedPosition), 150)
      })
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard/collections/:id',
      name: 'collection-detail',
      component: CollectionDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/languages',
      name: 'languages',
      component: LanguagePairSelectView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUpView,
      meta: { public: true, guestOnly: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const account = useAccountStore()

  if (!account.hasLoaded) {
    await account.refreshSession()
  }

  if (to.meta.requiresAuth && !account.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (
    to.meta.requiresAuth &&
    to.name !== 'languages' &&
    !selectedLanguagePairSlugFromUser(account.user)
  ) {
    return { name: 'languages' }
  }

  if (to.meta.guestOnly && account.user) {
    return authenticatedHomeTarget(account.user)
  }

  return true
})

export default router
