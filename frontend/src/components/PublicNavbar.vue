<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAccountStore } from '@/stores/account'
import { playTargetForUser, selectedLanguagePairSlugFromUser } from '@/utils/account-routing'

const account = useAccountStore()

const loginTarget = computed(() =>
  account.user ? playTargetForUser(account.user) : { name: 'login' },
)

const practiceTarget = computed(() =>
  account.user ? playTargetForUser(account.user) : { name: 'sign-up' },
)

const actionLabel = computed(() => {
  if (!account.user) {
    return 'Login'
  }

  return selectedLanguagePairSlugFromUser(account.user) ? 'Dashboard' : 'Continue setup'
})
</script>

<template>
  <header class="public-navbar">
    <div class="public-navbar__inner">
      <RouterLink class="public-navbar__brand" :to="{ name: 'home' }">Clozera</RouterLink>

      <nav class="public-navbar__nav" aria-label="Primary">
        <RouterLink class="public-navbar__login ui-button ui-button--pill" :to="loginTarget">
          {{ actionLabel }}
        </RouterLink>
        <RouterLink
          class="public-navbar__practice ui-button ui-button--primary ui-button--pill"
          :to="practiceTarget"
        >
          Practice
        </RouterLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.public-navbar {
  padding: 1.05rem var(--page-gutter);
  font-family: var(--font-sans);
  background: var(--ui-surface-muted);
  border-bottom: 1px solid var(--ui-border-default);
  backdrop-filter: blur(14px);
}

.public-navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: min(100%, var(--page-max-width));
  margin: 0 auto;
}

.public-navbar__brand {
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: var(--heading-brand);
  font-weight: var(--weight-extrabold);
  letter-spacing: 0;
  text-decoration: none;
}

.public-navbar__nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.65rem;
}

.public-navbar__login,
.public-navbar__practice {
  padding: 0 1.2rem;
  font-weight: var(--weight-bold);
  text-decoration: none;
}

@media (max-width: 560px) {
  .public-navbar__inner {
    gap: 0.7rem;
  }

  .public-navbar__brand {
    font-size: 1.35rem;
  }

  .public-navbar__nav {
    gap: 0.45rem;
  }

  .public-navbar__login,
  .public-navbar__practice {
    min-height: var(--ui-control-height-compact);
    padding: 0 0.8rem;
  }
}
</style>
