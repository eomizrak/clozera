<script setup>
import { reactive } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import PublicFooter from '@/components/PublicFooter.vue'
import PublicNavbar from '@/components/PublicNavbar.vue'
import { useAccountStore } from '@/stores/account'
import { authenticatedHomeTarget } from '@/utils/account-routing'

const account = useAccountStore()
const route = useRoute()
const router = useRouter()
const form = reactive({
  email: '',
  password: '',
})

async function submit() {
  const user = await account.login(form)
  router.push(route.query.redirect || authenticatedHomeTarget(user))
}
</script>

<template>
  <div class="auth-view">
    <PublicNavbar />

    <main class="auth-view__main" aria-labelledby="login-title">
      <section class="auth-view__section">
        <form class="auth-view__form" @submit.prevent="submit">
          <div class="auth-view__intro">
            <p class="auth-view__eyebrow">Login</p>
            <h1 id="login-title">Welcome back.</h1>
          </div>

          <label class="auth-view__field">
            <span>Email</span>
            <InputText v-model="form.email" type="email" autocomplete="email" required />
          </label>

          <label class="auth-view__field">
            <span>Password</span>
            <Password
              v-model="form.password"
              toggle-mask
              :feedback="false"
              autocomplete="current-password"
              required
            />
          </label>

          <Message v-if="account.error" severity="error" :closable="false">
            {{ account.error }}
          </Message>

          <Button
            class="ui-button ui-button--primary ui-button--pill auth-view__submit"
            type="submit"
            :loading="account.isLoading"
            label="Login"
          />

          <p class="auth-view__switch">
            Need an account?
            <RouterLink :to="{ name: 'sign-up', query: route.query }">Sign up</RouterLink>
          </p>
        </form>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>
