function userId(user) {
  return user?._id || user?.id
}

function ownerId(collection) {
  return collection?.owner?._id || collection?.owner
}

function pinnedCollectionIds(user) {
  return new Set((user?.pinnedCollections || []).map(id => String(id?._id || id)))
}

function isCollectionPinned(collection, user) {
  return pinnedCollectionIds(user).has(String(collection._id || collection.id))
}

function collectionAccessConditions(user) {
  const id = userId(user)
  return id ? [{ isPublic: true }, { owner: id }] : [{ isPublic: true }]
}

function collectionRelationship(collection, user) {
  if (collection.isOfficial) return 'official'

  const id = userId(user)
  const owner = ownerId(collection)

  return id && String(owner) === String(id) ? 'owned' : 'community'
}

function canEditCollection(collection, user) {
  const id = userId(user)
  const owner = ownerId(collection)

  return Boolean(id && !collection.isOfficial && String(owner) === String(id))
}

function collectionCapabilities(collection, user) {
  const isPinned = isCollectionPinned(collection, user)
  const canEdit = canEditCollection(collection, user)

  return {
    canEdit,
    canDelete: canEdit,
    canChangeVisibility: canEdit,
    canPin: !isPinned,
    canUnpin: isPinned,
  }
}

function userWithPinnedCollection(user, collectionId) {
  return {
    ...user,
    _id: user?._id,
    id: user?.id,
    pinnedCollections: [...(user?.pinnedCollections || []), collectionId],
  }
}

module.exports = {
  collectionAccessConditions,
  collectionCapabilities,
  collectionRelationship,
  isCollectionPinned,
  pinnedCollectionIds,
  userId,
  userWithPinnedCollection,
}
