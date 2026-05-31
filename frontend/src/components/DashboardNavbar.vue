<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import { User } from '@lucide/vue'
import { useAccountStore } from '@/stores/account'
import { useLanguagesStore } from '@/stores/languages'

const emit = defineEmits(['language-pair-change'])

const router = useRouter()
const account = useAccountStore()
const languages = useLanguagesStore()
const accountMenu = ref()
const accountDialogVisible = ref(false)
const accountMenuOpen = ref(false)

const userPairSlugs = computed(
  () => new Set((account.user?.languagePairs || []).map((pair) => pair.slug).filter(Boolean)),
)

const availablePairs = computed(() => {
  const fullPairs = languages.languagePairs.filter((pair) => userPairSlugs.value.has(pair.slug))

  if (fullPairs.length) {
    return fullPairs
  }

  return account.user?.languagePairs || []
})

const activePair = computed(
  () =>
    languages.pairBySlug(account.selectedLanguagePairSlug) ||
    account.user?.selectedLanguagePair ||
    availablePairs.value[0] ||
    null,
)

const accountItems = computed(() => [
  {
    label: 'Account info',
    command: () => {
      accountDialogVisible.value = true
    },
  },
  {
    label: 'Settings',
    disabled: true,
  },
  {
    label: 'Logout',
    command: async () => {
      await account.logout()
      router.push({ name: 'home' })
    },
  },
])

onMounted(() => {
  languages.ensureLoaded()
})

function languageLabel(language) {
  return language?.nativeName || language?.name || ''
}

function flagLabel(language) {
  return (language?.flagIso || language?.code || '').toUpperCase()
}

function flagEmoji(language) {
  const code = (language?.flagIso || '').toUpperCase()

  if (!/^[A-Z]{2}$/.test(code)) {
    return flagLabel(language)
  }

  return Array.from(code)
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}

function pairTitle(pair) {
  return languageLabel(pair?.targetLanguage) || pair?.name || 'Language pair'
}

function pairSubtitle(pair) {
  const target = languageLabel(pair?.targetLanguage)
  const base = languageLabel(pair?.baseLanguage)

  if (target && base) {
    return `${target} / ${base}`
  }

  return pair?.name || ''
}

function toggleAccountMenu(event) {
  accountMenu.value.toggle(event)
}

function pairBySlug(slug) {
  return availablePairs.value.find((pair) => pair.slug === slug) || activePair.value
}

async function selectLanguagePairSlug(slug) {
  if (!slug || slug === account.selectedLanguagePairSlug) return

  await account.updateSelectedLanguagePair(slug)
  emit('language-pair-change', slug)
}
</script>

<template>
  <header class="dashboard-navbar">
    <div class="dashboard-navbar__inner">
      <div class="dashboard-navbar__start">
        <RouterLink class="dashboard-navbar__brand" :to="{ name: 'dashboard' }">Clozera</RouterLink>
      </div>

      <div class="dashboard-navbar__end">
        <Select
          class="dashboard-navbar__pair-select"
          :model-value="account.selectedLanguagePairSlug"
          :options="availablePairs"
          option-value="slug"
          aria-label="Change language pair"
          @update:model-value="selectLanguagePairSlug"
        >
          <template #value="{ value }">
            <span class="dashboard-navbar__pair-value">
              <span class="dashboard-navbar__flags" aria-hidden="true">
                <span class="dashboard-navbar__flag">{{ flagEmoji(pairBySlug(value)?.targetLanguage) }}</span>
                <span class="dashboard-navbar__flag">{{ flagEmoji(pairBySlug(value)?.baseLanguage) }}</span>
              </span>
              <span class="dashboard-navbar__pair-name">{{ pairTitle(pairBySlug(value)) }}</span>
            </span>
          </template>

          <template #option="{ option }">
            <span class="dashboard-navbar__pair-option">
              <span class="dashboard-navbar__flags" aria-hidden="true">
                <span class="dashboard-navbar__flag">{{ flagEmoji(option.targetLanguage) }}</span>
                <span class="dashboard-navbar__flag">{{ flagEmoji(option.baseLanguage) }}</span>
              </span>
              <span class="dashboard-navbar__pair-copy">
                <strong>{{ pairTitle(option) }}</strong>
                <span>{{ pairSubtitle(option) }}</span>
              </span>
            </span>
          </template>

          <template #footer>
            <RouterLink class="dashboard-navbar__pair-manage" :to="{ name: 'languages' }">
              + Language Pair
            </RouterLink>
          </template>
        </Select>

        <button
          class="ui-button ui-button--icon dashboard-navbar__account"
          type="button"
          aria-label="Account"
          aria-haspopup="menu"
          :aria-expanded="accountMenuOpen"
          @click="toggleAccountMenu"
        >
          <User :size="20" aria-hidden="true" />
        </button>
        <Menu
          ref="accountMenu"
          :model="accountItems"
          popup
          @show="accountMenuOpen = true"
          @hide="accountMenuOpen = false"
        />
      </div>
    </div>
  </header>

  <Dialog
    v-model:visible="accountDialogVisible"
    class="ui-dialog"
    modal
    header="Account info"
    :draggable="false"
  >
    <strong>{{ account.user?.name }}</strong>
    <p>{{ account.user?.email }}</p>
    <p>{{ account.user?.selectedLanguagePair?.name || 'No language pair selected yet.' }}</p>
  </Dialog>
</template>

<style scoped>
.dashboard-navbar {
  padding: 0.95rem var(--page-gutter);
  font-family: var(--font-sans);
  background: var(--ui-surface-muted);
  border-bottom: 1px solid var(--ui-border-default);
  backdrop-filter: blur(14px);
}

.dashboard-navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: min(100%, var(--page-max-width));
  margin: 0 auto;
}

.dashboard-navbar__start,
.dashboard-navbar__end {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.dashboard-navbar__brand {
  display: block;
  color: var(--ui-text-strong);
  font-family: var(--font-display);
  font-size: var(--heading-brand);
  font-weight: var(--weight-extrabold);
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  text-decoration: none;
  white-space: nowrap;
}

.dashboard-navbar__pair-select.p-select {
  width: auto;
  min-width: var(--ui-language-select-width);
  height: var(--ui-icon-button-size);
  min-height: var(--ui-icon-button-size);
  color: var(--ui-color-primary-active);
  background: var(--ui-surface-base);
  border: 1px solid var(--ui-border-accent);
  border-radius: var(--ui-radius-control);
  box-shadow: var(--ui-shadow-soft);
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.dashboard-navbar__pair-select.p-select:not(.p-disabled):hover,
.dashboard-navbar__pair-select.p-select.p-focus {
  color: var(--ui-surface-base);
  background: var(--ui-color-primary);
  border-color: var(--ui-color-primary-hover);
}

.dashboard-navbar__pair-select :deep(.p-select-label) {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 0.7rem;
}

.dashboard-navbar__pair-select :deep(.p-select-dropdown) {
  width: var(--ui-pair-select-dropdown-width);
  height: 100%;
  color: inherit;
}

.dashboard-navbar__flags {
  display: inline-flex;
  align-items: center;
}

.dashboard-navbar__flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ui-flag-width);
  height: var(--ui-flag-height);
  font-size: var(--ui-flag-font-size);
  line-height: var(--leading-none);
  background: var(--ui-surface-base);
  border: 1px solid var(--ui-border-accent);
  border-radius: calc(var(--ui-radius-chip) / 2);
}

.dashboard-navbar__flag + .dashboard-navbar__flag {
  margin-left: -0.25rem;
}

.dashboard-navbar__pair-value,
.dashboard-navbar__pair-option {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.dashboard-navbar__pair-name {
  max-width: var(--ui-pair-name-measure);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  line-height: var(--leading-none);
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-navbar__pair-option {
  width: 100%;
  padding: 0.2rem 0;
}

.dashboard-navbar__pair-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dashboard-navbar__pair-copy strong {
  color: var(--ui-text-strong);
}

.dashboard-navbar__pair-copy span {
  color: var(--ui-text-body);
  font-size: var(--text-sm);
}

.dashboard-navbar__pair-manage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: var(--ui-control-height-compact);
  margin: 0.35rem;
  color: var(--ui-color-primary-contrast);
  font-weight: var(--weight-extrabold);
  text-decoration: none;
  background: var(--ui-color-primary);
  border: 1px solid var(--ui-color-primary-hover);
  border-radius: var(--ui-radius-control);
}

.dashboard-navbar__pair-manage:hover,
.dashboard-navbar__pair-manage:focus-visible {
  background: var(--ui-color-primary-hover);
  border-color: var(--ui-color-primary-active);
  outline: 0;
}

.dashboard-navbar__account.ui-button--icon {
  flex: 0 0 auto;
}

@media (max-width: 720px) {
  .dashboard-navbar {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
  }

  .dashboard-navbar__inner {
    align-items: center;
    flex-direction: row;
    gap: 0.75rem;
  }

  .dashboard-navbar__end {
    flex: 0 0 auto;
    gap: 0.5rem;
    justify-content: flex-end;
    width: auto;
    margin-left: auto;
  }

  .dashboard-navbar__pair-select.p-select {
    --ui-flag-width: 1.55rem;
    --ui-flag-height: 1.15rem;
    --ui-flag-font-size: 1.1rem;
    --ui-pair-select-dropdown-width: 1.45rem;

    width: 5.25rem;
    min-width: 5.25rem;
    height: var(--ui-icon-button-size-mobile);
    min-height: var(--ui-icon-button-size-mobile);
  }

  .dashboard-navbar__pair-select :deep(.p-select-label) {
    padding-right: 0;
    padding-left: 0.45rem;
  }

  .dashboard-navbar__pair-select :deep(.p-select-dropdown) {
    flex: 0 0 var(--ui-pair-select-dropdown-width);
  }

  .dashboard-navbar__pair-name {
    display: none;
  }
}

</style>
