<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import { ArrowLeft } from '@lucide/vue'
import DashboardNavbar from '@/components/DashboardNavbar.vue'
import { useAccountStore } from '@/stores/account'
import { useLanguagesStore } from '@/stores/languages'

const account = useAccountStore()
const languages = useLanguagesStore()
const router = useRouter()

const selectedBaseCode = ref('')
const selectedSlug = ref(account.selectedLanguagePairSlug)

const selectedPair = computed(() => languages.pairBySlug(selectedSlug.value))
const hasSelectedLanguagePair = computed(() => Boolean(account.selectedLanguagePairSlug))

const speakOptions = computed(() =>
  languages.languages.map((language) => ({
    label: language.name,
    value: language.code,
  })),
)

const learnOptions = computed(() =>
  languages.languagePairs
    .filter((pair) => pair.baseLanguage?.code === selectedBaseCode.value)
    .map((pair) => ({
      label: pair.targetLanguage?.name || pair.name,
      value: pair.slug,
    })),
)

onMounted(async () => {
  await languages.ensureLoaded()

  if (selectedPair.value?.baseLanguage?.code) {
    selectedBaseCode.value = selectedPair.value.baseLanguage.code
    return
  }

  if (speakOptions.value.length === 1) {
    selectedBaseCode.value = speakOptions.value[0].value
  }
})

watch(selectedBaseCode, () => {
  if (!learnOptions.value.some((option) => option.value === selectedSlug.value)) {
    selectedSlug.value = ''
  }
})

async function saveSelection() {
  if (!selectedSlug.value) return
  await account.updateSelectedLanguagePair(selectedSlug.value)
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="language-view">
    <DashboardNavbar />

    <main class="language-view__main" aria-labelledby="language-title">
      <section class="language-view__section">
        <RouterLink
          v-if="hasSelectedLanguagePair"
          class="ui-link-button ui-link-button--back language-view__back"
          :to="{ name: 'dashboard' }"
        >
          <ArrowLeft :size="18" aria-hidden="true" />
          <span>Back to dashboard</span>
        </RouterLink>

        <form class="language-view__form" @submit.prevent="saveSelection">
          <div class="language-view__intro">
            <p class="language-view__eyebrow">Language setup</p>
            <h1 id="language-title">Choose your practice direction.</h1>
          </div>

          <ProgressSpinner v-if="languages.isLoading" class="language-view__loading" />

          <Message v-else-if="languages.error" severity="error" :closable="false">
            {{ languages.error }}
          </Message>

          <template v-else>
            <label class="language-view__field" for="base-language">
              <span>I speak:</span>
              <Select
                v-model="selectedBaseCode"
                input-id="base-language"
                option-label="label"
                option-value="value"
                :options="speakOptions"
                placeholder="Select a language"
              />
            </label>

            <label class="language-view__field" for="target-language">
              <span>I want to learn:</span>
              <Select
                v-model="selectedSlug"
                input-id="target-language"
                option-label="label"
                option-value="value"
                :disabled="!selectedBaseCode"
                :options="learnOptions"
                placeholder="Select a language"
              />
            </label>

            <Message
              v-if="selectedBaseCode && !learnOptions.length"
              severity="warn"
              :closable="false"
            >
              No learning languages are available for this selection yet.
            </Message>

            <Button
              class="ui-button ui-button--primary ui-button--pill language-view__submit"
              type="submit"
              :disabled="!selectedSlug"
              :loading="account.isLoading"
              label="Continue"
            />
          </template>
        </form>
      </section>
    </main>
  </div>
</template>
