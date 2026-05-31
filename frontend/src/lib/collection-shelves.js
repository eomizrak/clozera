const FALLBACK_GROUP = {
  id: 'ungrouped',
  name: 'Collections',
  type: 'ungrouped',
  description: '',
  order: Number.MAX_SAFE_INTEGER,
}

const SHELVES = [
  { id: 'official', name: 'Official', relationship: 'official' },
  { id: 'owned', name: 'My Collections', relationship: 'owned' },
  { id: 'community', name: 'Community', relationship: 'community' },
]

function groupKey(collection) {
  return collection.group?.id || `${collection.group?.type || FALLBACK_GROUP.type}`
}

function sortGroups(left, right) {
  if ((left.order ?? 0) !== (right.order ?? 0)) {
    return (left.order ?? 0) - (right.order ?? 0)
  }

  return left.name.localeCompare(right.name)
}

function officialGroups(collections) {
  const groups = new Map()

  for (const collection of collections) {
    const group = collection.group || FALLBACK_GROUP
    const key = groupKey(collection)

    if (!groups.has(key)) {
      groups.set(key, {
        ...group,
        collections: [],
      })
    }

    groups.get(key).collections.push(collection)
  }

  return Array.from(groups.values()).sort(sortGroups)
}

function flatShelfGroup(shelf, collections) {
  return [
    {
      id: shelf.id,
      name: shelf.name,
      type: shelf.relationship,
      description: '',
      order: 0,
      collections,
    },
  ]
}

export function buildCollectionShelves(collections = []) {
  return SHELVES.map((shelf) => {
    const shelfCollections = collections.filter(
      (collection) => collection.relationship === shelf.relationship,
    )

    return {
      ...shelf,
      groups:
        shelf.relationship === 'official'
          ? officialGroups(shelfCollections)
          : flatShelfGroup(shelf, shelfCollections),
    }
  }).filter((shelf) => shelf.groups.some((group) => group.collections.length > 0))
}

export function filterCollectionShelves(shelves = [], query = '') {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return shelves
  }

  return shelves
    .map((shelf) => ({
      ...shelf,
      groups: shelf.groups
        .map((group) => {
          const groupMatches = group.name.toLowerCase().includes(normalizedQuery)
          const matchedCollections = group.collections.filter((collection) =>
            collection.name.toLowerCase().includes(normalizedQuery),
          )

          return {
            ...group,
            collections: groupMatches ? group.collections : matchedCollections,
          }
        })
        .filter((group) => group.collections.length > 0),
    }))
    .filter((shelf) => shelf.groups.length > 0)
}
