import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/api'
import { buildCollectionShelves } from '@/lib/collection-shelves'

function apiErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Unable to load collections.'
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref([])
  const dashboardCollections = ref([])
  const activeCollection = ref(null)
  const activeCollectionSentences = ref([])
  const meta = ref({
    total: 0,
    page: 1,
    perPage: 20,
  })
  const sentencesMeta = ref({
    total: 0,
    page: 1,
    perPage: 20,
  })
  const isLoading = ref(false)
  const isLoadingDashboard = ref(false)
  const isLoadingCollection = ref(false)
  const isCreating = ref(false)
  const isPinning = ref(false)
  const isCreatingSentence = ref(false)
  const isUpdatingSentence = ref(false)
  const hasLoaded = ref(false)
  const error = ref('')
  const expandedGroupIds = ref(new Set())

  const collectionShelves = computed(() => buildCollectionShelves(collections.value))

  const groupedCollections = computed(() => collectionShelves.value.flatMap((shelf) => shelf.groups))

  async function loadCollections({ languagePair, owner, page = 1, perPage = 100 } = {}) {
    isLoading.value = true
    error.value = ''

    try {
      const response = await api.get('/collections', {
        params: {
          languagePair,
          owner,
          page,
          perPage,
        },
      })
      collections.value = response.data.data.collections
      meta.value = response.data.meta
      hasLoaded.value = true
    } catch (loadError) {
      collections.value = []
      error.value = apiErrorMessage(loadError)
      throw loadError
    } finally {
      isLoading.value = false
    }
  }

  async function loadDashboardCollections({ languagePair } = {}) {
    isLoadingDashboard.value = true
    error.value = ''

    try {
      const response = await api.get('/dashboard/collections', {
        params: {
          languagePair,
        },
      })
      dashboardCollections.value = response.data.data.collections
      return dashboardCollections.value
    } catch (loadError) {
      dashboardCollections.value = []
      error.value = apiErrorMessage(loadError)
      throw loadError
    } finally {
      isLoadingDashboard.value = false
    }
  }

  async function loadCollection(collectionId) {
    isLoadingCollection.value = true
    error.value = ''

    try {
      const response = await api.get(`/collections/${collectionId}`)
      activeCollection.value = response.data.data
      return activeCollection.value
    } catch (loadError) {
      activeCollection.value = null
      error.value = apiErrorMessage(loadError)
      throw loadError
    } finally {
      isLoadingCollection.value = false
    }
  }

  async function loadCollectionSentences({ collectionId, page = 1, perPage = 100 } = {}) {
    isLoadingCollection.value = true
    error.value = ''

    try {
      const response = await api.get(`/collections/${collectionId}/sentences`, {
        params: {
          page,
          perPage,
        },
      })
      activeCollectionSentences.value = response.data.data.sentences
      sentencesMeta.value = response.data.meta
    } catch (loadError) {
      activeCollectionSentences.value = []
      error.value = apiErrorMessage(loadError)
      throw loadError
    } finally {
      isLoadingCollection.value = false
    }
  }

  async function createCollection(payload) {
    isCreating.value = true
    error.value = ''

    try {
      const response = await api.post('/collections', payload)
      collections.value = collections.value.concat(response.data.data)
      return response.data.data
    } catch (createError) {
      error.value = apiErrorMessage(createError)
      throw createError
    } finally {
      isCreating.value = false
    }
  }

  function replaceCollection(nextCollection) {
    collections.value = collections.value.map((collection) =>
      collection.id === nextCollection.id ? nextCollection : collection,
    )
    dashboardCollections.value = dashboardCollections.value.map((collection) =>
      collection.id === nextCollection.id ? nextCollection : collection,
    )
    if (activeCollection.value?.id === nextCollection.id) {
      activeCollection.value = nextCollection
    }
  }

  function upsertDashboardCollection(nextCollection) {
    const exists = dashboardCollections.value.some((collection) => collection.id === nextCollection.id)
    dashboardCollections.value = exists
      ? dashboardCollections.value.map((collection) =>
          collection.id === nextCollection.id ? nextCollection : collection,
        )
      : dashboardCollections.value.concat(nextCollection)
  }

  async function updateCollection(collectionId, payload) {
    error.value = ''

    try {
      const response = await api.patch(`/collections/${collectionId}`, payload)
      replaceCollection(response.data.data)
      return response.data.data
    } catch (updateError) {
      error.value = apiErrorMessage(updateError)
      throw updateError
    }
  }

  async function deleteCollection(collectionId) {
    error.value = ''

    try {
      await api.delete(`/collections/${collectionId}`)
      collections.value = collections.value.filter((collection) => collection.id !== collectionId)
      dashboardCollections.value = dashboardCollections.value.filter((collection) => collection.id !== collectionId)
      if (activeCollection.value?.id === collectionId) {
        activeCollection.value = null
      }
    } catch (deleteError) {
      error.value = apiErrorMessage(deleteError)
      throw deleteError
    }
  }

  async function pinCollection(collectionId) {
    isPinning.value = true
    error.value = ''

    try {
      const response = await api.post('/dashboard/collections', { collectionId })
      replaceCollection(response.data.data)
      upsertDashboardCollection(response.data.data)
      return response.data.data
    } catch (pinError) {
      error.value = apiErrorMessage(pinError)
      throw pinError
    } finally {
      isPinning.value = false
    }
  }

  async function unpinCollection(collectionId) {
    isPinning.value = true
    error.value = ''

    try {
      const response = await api.delete(`/dashboard/collections/${collectionId}`)
      const unpinnedCollection = response.data?.data || null

      if (unpinnedCollection) {
        replaceCollection(unpinnedCollection)
      }

      dashboardCollections.value = dashboardCollections.value.filter((collection) => collection.id !== collectionId)
      if (activeCollection.value?.id === collectionId) {
        activeCollection.value = unpinnedCollection || activeCollection.value
      }
    } catch (unpinError) {
      error.value = apiErrorMessage(unpinError)
      throw unpinError
    } finally {
      isPinning.value = false
    }
  }

  async function createSentence(collectionId, payload) {
    isCreatingSentence.value = true
    error.value = ''

    try {
      const response = await api.post(`/collections/${collectionId}/sentences`, payload)
      return response.data.data
    } catch (createError) {
      error.value = apiErrorMessage(createError)
      throw createError
    } finally {
      isCreatingSentence.value = false
    }
  }

  async function updateSentence(collectionId, sentenceId, payload) {
    isUpdatingSentence.value = true
    error.value = ''

    try {
      const response = await api.patch(`/collections/${collectionId}/sentences/${sentenceId}`, payload)
      return response.data.data
    } catch (updateError) {
      error.value = apiErrorMessage(updateError)
      throw updateError
    } finally {
      isUpdatingSentence.value = false
    }
  }

  function isGroupExpanded(group) {
    return expandedGroupIds.value.has(group.id)
  }

  function toggleGroup(group) {
    const nextExpanded = new Set(expandedGroupIds.value)

    if (nextExpanded.has(group.id)) {
      nextExpanded.delete(group.id)
    } else {
      nextExpanded.add(group.id)
    }

    expandedGroupIds.value = nextExpanded
  }

  return {
    collections,
    collectionShelves,
    dashboardCollections,
    activeCollection,
    activeCollectionSentences,
    createCollection,
    createSentence,
    deleteCollection,
    error,
    expandedGroupIds,
    groupedCollections,
    hasLoaded,
    isCreating,
    isCreatingSentence,
    isLoadingDashboard,
    isPinning,
    isUpdatingSentence,
    isGroupExpanded,
    isLoading,
    isLoadingCollection,
    loadCollection,
    loadCollections,
    loadDashboardCollections,
    loadCollectionSentences,
    meta,
    sentencesMeta,
    toggleGroup,
    pinCollection,
    unpinCollection,
    updateCollection,
    updateSentence,
  }
})
