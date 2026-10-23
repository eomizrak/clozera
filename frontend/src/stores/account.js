import { create } from 'zustand'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'

function userState(user) {
  const label = user?.name || user?.username || user?.email || 'C'
  return {
    user,
    isAuthenticated: Boolean(user),
    selectedLanguagePairSlug: user?.selectedLanguagePair?.slug || '',
    initials: label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  }
}

export const useAccountStore = create((set, get) => {
  async function request(method, path, payload, fallback) {
    set({ isLoading: true, error: '' })
    try {
      const { data } = await (payload === undefined
        ? api[method](path)
        : api[method](path, payload))
      set({ ...userState(data.data), hasLoaded: true })
      return data.data
    } catch (error) {
      set({ error: apiErrorMessage(error, fallback) })
      throw error
    } finally {
      set({ isLoading: false })
    }
  }
  let sessionRequest
  return {
    ...userState(null),
    hasLoaded: false,
    isLoading: false,
    error: '',
    setUser: (user) => set(userState(user)),
    refreshSession() {
      if (sessionRequest) return sessionRequest
      sessionRequest = request(
        'get',
        '/accounts/session',
        undefined,
        'Unable to restore your session.',
      )
        .catch(() => {
          set(userState(null))
          return null
        })
        .finally(() => {
          set({ hasLoaded: true })
          sessionRequest = null
        })
      return sessionRequest
    },
    login: (payload) => request('post', '/accounts/session', payload, 'Invalid email or password.'),
    signUp: (payload) => request('post', '/users', payload, 'Unable to create your account.'),
    updateProfile: (payload) =>
      request('patch', '/users/me', payload, 'Unable to update your profile.'),
    updateSelectedLanguagePair: (slug) => get().updateProfile({ selectedLanguagePairSlug: slug }),
    async logout() {
      set({ isLoading: true, error: '' })
      try {
        await api.delete('/accounts/session')
      } finally {
        set({ ...userState(null), hasLoaded: true, isLoading: false })
      }
    },
  }
})
