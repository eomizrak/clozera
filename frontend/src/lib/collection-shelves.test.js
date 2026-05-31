import { describe, expect, it } from 'vitest'
import { buildCollectionShelves, filterCollectionShelves } from '@/lib/collection-shelves'

describe('collection shelves', () => {
  it('builds ordered shelves and groups official collections', () => {
    const shelves = buildCollectionShelves([
      {
        id: 'owned-1',
        name: 'Food',
        relationship: 'owned',
      },
      {
        id: 'community-1',
        name: 'Community Travel',
        relationship: 'community',
      },
      {
        id: 'official-2',
        name: 'Topic Basics',
        relationship: 'official',
        group: { id: 'topics', name: 'Topics', type: 'topic', order: 2 },
      },
      {
        id: 'official-1',
        name: 'Fast Track Level 1',
        relationship: 'official',
        group: { id: 'fast-track', name: 'Fast Track', type: 'fast_track', order: 1 },
      },
    ])

    expect(shelves.map((shelf) => shelf.name)).toEqual(['Official', 'My Collections', 'Community'])
    expect(shelves[0].groups.map((group) => group.name)).toEqual(['Fast Track', 'Topics'])
    expect(shelves[1].groups).toMatchObject([
      {
        id: 'owned',
        name: 'My Collections',
        type: 'owned',
        collections: [{ id: 'owned-1' }],
      },
    ])
  })

  it('uses a fallback group for ungrouped official collections', () => {
    const shelves = buildCollectionShelves([
      {
        id: 'official-1',
        name: 'Standalone Official',
        relationship: 'official',
      },
    ])

    expect(shelves).toMatchObject([
      {
        id: 'official',
        groups: [
          {
            id: 'ungrouped',
            name: 'Collections',
            type: 'ungrouped',
            collections: [{ id: 'official-1' }],
          },
        ],
      },
    ])
  })

  it('filters shelves by group or collection name', () => {
    const shelves = buildCollectionShelves([
      {
        id: 'official-1',
        name: 'Fast Track Level 1',
        relationship: 'official',
        group: { id: 'fast-track', name: 'Fast Track', type: 'fast_track', order: 1 },
      },
      {
        id: 'official-2',
        name: 'Topic Basics',
        relationship: 'official',
        group: { id: 'topics', name: 'Topics', type: 'topic', order: 2 },
      },
      {
        id: 'owned-1',
        name: 'Food',
        relationship: 'owned',
      },
    ])

    expect(filterCollectionShelves(shelves, 'fast')[0].groups[0].collections).toHaveLength(1)
    expect(filterCollectionShelves(shelves, 'food')).toMatchObject([
      {
        id: 'owned',
        groups: [
          {
            collections: [{ id: 'owned-1' }],
          },
        ],
      },
    ])
  })
})
