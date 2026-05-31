import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/api'

function apiErrorMessage(error, fallback) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  )
}

export const useAccountStore = defineStore('account', () => {
  const user = ref(null)
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => Boolean(user.value))
  const selectedLanguagePairSlug = computed(() => user.value?.selectedLanguagePair?.slug || '')
  const initials = computed(() => {
    const label = user.value?.name || user.value?.username || user.value?.email || 'C'
    return label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('')
  })

  function setUser(nextUser) {
    user.value = nextUser
  }

  async function refreshSession() {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.get('/accounts/session')
      user.value = response.data.data
      return user.value
    } catch (sessionError) {
      user.value = null
      error.value = apiErrorMessage(sessionError, 'Unable to restore your session.')
      return null
    } finally {
      hasLoaded.value = true
      isLoading.value = false
    }
  }

  async function login(credentials) {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.post('/accounts/session', credentials)
      user.value = response.data.data
      hasLoaded.value = true
      return user.value
    } catch (loginError) {
      error.value = apiErrorMessage(loginError, 'Invalid email or password.')
      throw loginError
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(payload) {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.post('/users', payload)
      user.value = response.data.data
      hasLoaded.value = true
      return user.value
    } catch (signUpError) {
      error.value = apiErrorMessage(signUpError, 'Unable to create your account.')
      throw signUpError
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(payload) {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.patch('/users/me', payload)
      user.value = response.data.data
      return user.value
    } catch (profileError) {
      error.value = apiErrorMessage(profileError, 'Unable to update your profile.')
      throw profileError
    } finally {
      isLoading.value = false
    }
  }

  async function updateSelectedLanguagePair(nextSlug) {
    return updateProfile({ selectedLanguagePairSlug: nextSlug })
  }

  async function logout() {
    isLoading.value = true
    error.value = ''

    try {
      await api.delete('/accounts/session')
    } finally {
      user.value = null
      hasLoaded.value = true
      isLoading.value = false
    }
  }

  return {
    error,
    hasLoaded,
    initials,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshSession,
    selectedLanguagePairSlug,
    setUser,
    signUp,
    updateProfile,
    updateSelectedLanguagePair,
    user,
  }
})
