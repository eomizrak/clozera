import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/api'

function apiErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Unable to load languages.'
}

export const useLanguagesStore = defineStore('languages', () => {
  const languages = ref([])
  const languagePairs = ref([])
  const isLoading = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')

  const pairOptions = computed(() =>
    languagePairs.value.map((pair) => ({
      label: pair.name,
      value: pair.slug,
      pair,
    })),
  )

  function pairBySlug(slug) {
    return languagePairs.value.find((pair) => pair.slug === slug) || null
  }

  async function loadLanguages() {
    isLoading.value = true
    error.value = ''

    try {
      const [languagesResponse, pairsResponse] = await Promise.all([
        api.get('/languages'),
        api.get('/language-pairs'),
      ])
      languages.value = languagesResponse.data.data
      languagePairs.value = pairsResponse.data.data
      hasLoaded.value = true
    } catch (loadError) {
      error.value = apiErrorMessage(loadError)
      throw loadError
    } finally {
      isLoading.value = false
    }
  }

  async function ensureLoaded() {
    if (!hasLoaded.value && !isLoading.value) {
      await loadLanguages()
    }
  }

  return {
    ensureLoaded,
    error,
    hasLoaded,
    isLoading,
    languagePairs,
    languages,
    loadLanguages,
    pairBySlug,
    pairOptions,
  }
})
