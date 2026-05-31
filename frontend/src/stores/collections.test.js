import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCollectionsStore } from '@/stores/collections'

const api = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  default: api,
}))

describe('collections store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads collections into relationship shelves', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          collections: [
            {
              id: 'collection-2',
              name: 'Food',
              relationship: 'owned',
            },
            {
              id: 'collection-3',
              name: 'Community Travel',
              relationship: 'community',
              creator: { displayName: 'Grace Hopper' },
            },
            {
              id: 'collection-1',
              name: 'Level 1',
              relationship: 'official',
              group: { id: 'fast-track', name: 'Fast Track', type: 'fast_track', order: 1 },
            },
            {
              id: 'collection-4',
              name: 'Food Basics',
              relationship: 'official',
              group: { id: 'topics', name: 'Topics', type: 'topic', order: 2 },
            },
          ],
        },
        meta: { total: 2, page: 1, perPage: 100 },
      },
    })

    const collections = useCollectionsStore()
    await collections.loadCollections({ languagePair: 'deu-eng', perPage: 100 })

    expect(api.get).toHaveBeenCalledWith('/collections', {
      params: {
        languagePair: 'deu-eng',
        owner: undefined,
        page: 1,
        perPage: 100,
      },
    })
    expect(collections.collectionShelves.map((shelf) => shelf.name)).toEqual([
      'Official',
      'My Collections',
      'Community',
    ])
    expect(collections.collectionShelves[0].groups.map((group) => group.name)).toEqual([
      'Fast Track',
      'Topics',
    ])
    expect(collections.collectionShelves[1].groups[0].collections[0].name).toBe('Food')
    expect(collections.collectionShelves[2].groups[0].collections[0].creator.displayName).toBe('Grace Hopper')
  })

  it('creates a collection', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          id: 'collection-3',
          name: 'Travel',
        },
      },
    })

    const collections = useCollectionsStore()
    const createdCollection = await collections.createCollection({
      name: 'Travel',
      type: 'topic',
      languagePairSlug: 'deu-eng',
    })

    expect(api.post).toHaveBeenCalledWith('/collections', {
      name: 'Travel',
      type: 'topic',
      languagePairSlug: 'deu-eng',
    })
    expect(createdCollection.name).toBe('Travel')
  })

  it('loads and mutates dashboard collections', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          collections: [{ id: 'collection-1', name: 'Level 1', isPinned: true }],
        },
        meta: { total: 1, page: 1, perPage: 1 },
      },
    })
    api.post.mockResolvedValueOnce({
      data: {
        data: { id: 'collection-2', name: 'Travel', isPinned: true },
      },
    })
    api.delete.mockResolvedValueOnce({
      data: {
        data: { id: 'collection-1', name: 'Level 1', isPinned: false },
      },
    })

    const collections = useCollectionsStore()
    await collections.loadDashboardCollections({ languagePair: 'deu-eng' })
    const pinned = await collections.pinCollection('collection-2')
    await collections.unpinCollection('collection-1')

    expect(api.get).toHaveBeenCalledWith('/dashboard/collections', {
      params: {
        languagePair: 'deu-eng',
      },
    })
    expect(api.post).toHaveBeenCalledWith('/dashboard/collections', { collectionId: 'collection-2' })
    expect(api.delete).toHaveBeenCalledWith('/dashboard/collections/collection-1')
    expect(collections.dashboardCollections).toEqual([
      { id: 'collection-2', name: 'Travel', isPinned: true },
    ])
    expect(pinned.isPinned).toBe(true)
  })

  it('updates and deletes collection metadata through the API', async () => {
    api.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: 'collection-1',
          name: 'Travel Practice',
          description: 'Ready to share',
          visibility: 'public',
        },
      },
    })
    api.delete.mockResolvedValueOnce({})

    const collections = useCollectionsStore()
    collections.collections = [{ id: 'collection-1', name: 'Draft Practice', visibility: 'private' }]
    collections.dashboardCollections = [{ id: 'collection-1', name: 'Draft Practice', visibility: 'private' }]

    const updated = await collections.updateCollection('collection-1', {
      name: 'Travel Practice',
      description: 'Ready to share',
      visibility: 'public',
    })
    await collections.deleteCollection('collection-1')

    expect(api.patch).toHaveBeenCalledWith('/collections/collection-1', {
      name: 'Travel Practice',
      description: 'Ready to share',
      visibility: 'public',
    })
    expect(api.delete).toHaveBeenCalledWith('/collections/collection-1')
    expect(updated.name).toBe('Travel Practice')
    expect(collections.collections).toEqual([])
    expect(collections.dashboardCollections).toEqual([])
  })

  it('updates a sentence', async () => {
    api.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: 'sentence-1',
          text: 'Ich {{lerne}}.',
          translation: 'I learn.',
          cloze: 'lerne',
        },
      },
    })

    const collections = useCollectionsStore()
    const updatedSentence = await collections.updateSentence('collection-1', 'sentence-1', {
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
    })

    expect(api.patch).toHaveBeenCalledWith('/collections/collection-1/sentences/sentence-1', {
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
    })
    expect(updatedSentence.cloze).toBe('lerne')
  })
})
