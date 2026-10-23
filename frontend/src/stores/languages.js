import { create } from 'zustand'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'

export const useLanguagesStore = create((set, get) => {
  let pending
  return {
    languages: [],
    languagePairs: [],
    pairOptions: [],
    isLoading: false,
    hasLoaded: false,
    error: '',
    pairBySlug: (slug) => get().languagePairs.find((pair) => pair.slug === slug) || null,
    loadLanguages() {
      if (pending) return pending
      set({ isLoading: true, error: '' })
      pending = Promise.all([api.get('/languages'), api.get('/language-pairs')])
        .then(([languages, pairs]) =>
          set({
            languages: languages.data.data,
            languagePairs: pairs.data.data,
            hasLoaded: true,
            pairOptions: pairs.data.data.map((pair) => ({
              label: pair.name,
              value: pair.slug,
              pair,
            })),
          }),
        )
        .catch((error) => {
          set({ error: apiErrorMessage(error, 'Unable to load languages.') })
          throw error
        })
        .finally(() => {
          set({ isLoading: false })
          pending = null
        })
      return pending
    },
    ensureLoaded: () => (get().hasLoaded ? Promise.resolve() : get().loadLanguages()),
  }
})
