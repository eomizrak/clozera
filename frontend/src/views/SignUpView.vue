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
  name: '',
  username: '',
  email: '',
  password: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
})

async function submit() {
  const user = await account.signUp(form)
  router.push(route.query.redirect || authenticatedHomeTarget(user))
}
</script>

<template>
  <div class="auth-view">
    <PublicNavbar />

    <main class="auth-view__main" aria-labelledby="signup-title">
      <section class="auth-view__section">
        <form class="auth-view__form" @submit.prevent="submit">
          <div class="auth-view__intro">
            <p class="auth-view__eyebrow">Sign up</p>
            <h1 id="signup-title">Create your account.</h1>
          </div>

          <label class="auth-view__field">
            <span>Name</span>
            <InputText v-model="form.name" autocomplete="name" required />
          </label>

          <label class="auth-view__field">
            <span>Username</span>
            <InputText v-model="form.username" autocomplete="username" required />
          </label>

          <label class="auth-view__field">
            <span>Email</span>
            <InputText v-model="form.email" type="email" autocomplete="email" required />
          </label>

          <label class="auth-view__field">
            <span>Password</span>
            <Password v-model="form.password" toggle-mask autocomplete="new-password" required />
          </label>

          <Message v-if="account.error" severity="error" :closable="false">
            {{ account.error }}
          </Message>

          <Button
            class="ui-button ui-button--primary ui-button--pill auth-view__submit"
            type="submit"
            :loading="account.isLoading"
            label="Create account"
          />

          <p class="auth-view__switch">
            Already have an account?
            <RouterLink :to="{ name: 'login', query: route.query }">Login</RouterLink>
          </p>
        </form>
      </section>
    </main>

    <PublicFooter />
  </div>
</template>
