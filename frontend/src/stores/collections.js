import { create } from 'zustand'
import api from '@/lib/api'
import { apiErrorMessage } from '@/lib/api-error'
import { buildCollectionShelves } from '@/lib/collection-shelves'

export const useCollectionsStore = create((set, get) => {
  async function request(flag, action) {
    set({ error: '', ...(flag ? { [flag]: true } : {}) })
    try {
      return await action()
    } catch (error) {
      set({ error: apiErrorMessage(error, 'Unable to load collections.') })
      throw error
    } finally {
      if (flag) set({ [flag]: false })
    }
  }
  function library(collections) {
    const collectionShelves = buildCollectionShelves(collections)
    return {
      collections,
      collectionShelves,
      groupedCollections: collectionShelves.flatMap((shelf) => shelf.groups),
    }
  }
  function replace(next) {
    set((state) => ({
      ...library(state.collections.map((item) => (item.id === next.id ? next : item))),
      dashboardCollections: state.dashboardCollections.map((item) =>
        item.id === next.id ? next : item,
      ),
      activeCollection: state.activeCollection?.id === next.id ? next : state.activeCollection,
    }))
  }
  return {
    ...library([]),
    dashboardCollections: [],
    activeCollection: null,
    activeCollectionSentences: [],
    meta: { total: 0, page: 1, perPage: 20 },
    sentencesMeta: { total: 0, page: 1, perPage: 20 },
    isLoading: false,
    isLoadingDashboard: false,
    isLoadingCollection: false,
    isCreating: false,
    isPinning: false,
    isCreatingSentence: false,
    isUpdatingSentence: false,
    hasLoaded: false,
    error: '',
    expandedGroupIds: new Set(),
    loadCollections: ({ languagePair, owner, page = 1, perPage = 100 } = {}) =>
      request('isLoading', async () => {
        set(library([]))
        const { data } = await api.get('/collections', {
          params: { languagePair, owner, page, perPage },
        })
        set({ ...library(data.data.collections), meta: data.meta, hasLoaded: true })
      }),
    loadDashboardCollections: ({ languagePair } = {}) =>
      request('isLoadingDashboard', async () => {
        set({ dashboardCollections: [] })
        const { data } = await api.get('/dashboard/collections', { params: { languagePair } })
        set({ dashboardCollections: data.data.collections })
        return data.data.collections
      }),
    loadCollection: (id) =>
      request('isLoadingCollection', async () => {
        set({ activeCollection: null })
        const { data } = await api.get(`/collections/${id}`)
        set({ activeCollection: data.data })
        return data.data
      }),
    loadCollectionSentences: ({ collectionId, page = 1, perPage = 100 } = {}) =>
      request('isLoadingCollection', async () => {
        set({ activeCollectionSentences: [] })
        const { data } = await api.get(`/collections/${collectionId}/sentences`, {
          params: { page, perPage },
        })
        set({ activeCollectionSentences: data.data.sentences, sentencesMeta: data.meta })
      }),
    createCollection: (payload) =>
      request('isCreating', async () => {
        const { data } = await api.post('/collections', payload)
        set(library([...get().collections, data.data]))
        return data.data
      }),
    updateCollection: (id, payload) =>
      request(null, async () => {
        const { data } = await api.patch(`/collections/${id}`, payload)
        replace(data.data)
        return data.data
      }),
    deleteCollection: (id) =>
      request(null, async () => {
        await api.delete(`/collections/${id}`)
        set((state) => ({
          ...library(state.collections.filter((item) => item.id !== id)),
          dashboardCollections: state.dashboardCollections.filter((item) => item.id !== id),
          activeCollection: state.activeCollection?.id === id ? null : state.activeCollection,
        }))
      }),
    pinCollection: (id) =>
      request('isPinning', async () => {
        const { data } = await api.post('/dashboard/collections', { collectionId: id })
        replace(data.data)
        set((state) => ({
          dashboardCollections: [
            ...state.dashboardCollections.filter((item) => item.id !== id),
            data.data,
          ],
        }))
        return data.data
      }),
    unpinCollection: (id) =>
      request('isPinning', async () => {
        const { data } = await api.delete(`/dashboard/collections/${id}`)
        if (data?.data) replace(data.data)
        set((state) => ({
          dashboardCollections: state.dashboardCollections.filter((item) => item.id !== id),
        }))
      }),
    createSentence: (id, payload) =>
      request('isCreatingSentence', async () => {
        const { data } = await api.post(`/collections/${id}/sentences`, payload)
        return data.data
      }),
    updateSentence: (id, sentenceId, payload) =>
      request('isUpdatingSentence', async () => {
        const { data } = await api.patch(`/collections/${id}/sentences/${sentenceId}`, payload)
        return data.data
      }),
    isGroupExpanded: (group) => get().expandedGroupIds.has(group.id),
    toggleGroup(group) {
      const ids = new Set(get().expandedGroupIds)
      if (ids.has(group.id)) ids.delete(group.id)
      else ids.add(group.id)
      set({ expandedGroupIds: ids })
    },
  }
})
