const Collection = require('../models/collection')
const CollectionSentence = require('../models/collection-sentence')
const LanguagePair = require('../models/language-pair')
const User = require('../models/user')
const { resolveActiveLanguagePair } = require('../lib/active-language-pair')
const {
  collectionAccessConditions,
  collectionCapabilities,
  collectionRelationship,
  isCollectionPinned,
  pinnedCollectionIds,
  userId,
  userWithPinnedCollection,
} = require('../lib/collection-capabilities')
const { normalizeSentencePayload } = require('../lib/sentence-authoring')

function collectionNotFoundError() {
  const error = new Error('Collection not found.')
  error.status = 404
  error.code = 'NOT_FOUND'
  return error
}

function languagePairNotFoundError(message = 'Language pair not found.') {
  const error = new Error(message)
  error.status = 404
  error.code = 'LANGUAGE_PAIR_NOT_FOUND'
  return error
}

function collectionOwnershipError() {
  const error = new Error('Only the collection owner can change this collection.')
  error.status = 403
  error.code = 'FORBIDDEN'
  return error
}

function invalidVisibilityError() {
  return validationError('Visibility must be public or private.', [
    { field: 'visibility', message: 'Visibility must be public or private.' },
  ])
}

function validationError(message, details = []) {
  const error = new Error(message)
  error.status = 400
  error.code = 'VALIDATION_ERROR'
  error.details = details
  return error
}

function serializeLanguagePair(pair) {
  if (!pair) return null

  if (!pair.slug) {
    return pair
  }

  return {
    id: pair.id,
    slug: pair.slug,
    name: pair.name,
  }
}

function serializeCollectionGroup(group) {
  if (!group) return null

  return {
    id: group.id,
    name: group.name,
    type: group.type,
    description: group.description,
    order: group.order,
  }
}

function serializeCreator(owner) {
  if (!owner || !owner.id) return null

  return {
    id: owner.id,
    displayName: owner.name || owner.username,
  }
}

function serializeCollection(collection, user) {
  const relationship = collectionRelationship(collection, user)

  const serialized = {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    type: collection.type,
    level: collection.level,
    sentenceCount: collection.sentenceCount,
    isOfficial: collection.isOfficial,
    isPublic: collection.isPublic,
    relationship,
    visibility: collection.isPublic ? 'public' : 'private',
    isPinned: isCollectionPinned(collection, user),
    capabilities: collectionCapabilities(collection, user),
    languagePair: serializeLanguagePair(collection.languagePair),
  }

  if (collection.group) {
    serialized.group = serializeCollectionGroup(collection.group)
  }

  if (relationship === 'community') {
    serialized.creator = serializeCreator(collection.owner)
  }

  return serialized
}

function accessibleCollectionFilter(collectionId, user) {
  return {
    _id: collectionId,
    $or: collectionAccessConditions(user),
  }
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function resolveLanguagePairSlug(slug) {
  const pair = await LanguagePair.findOne({ slug, active: true })

  if (!pair) {
    throw languagePairNotFoundError()
  }

  return pair
}

async function listCollections({ languagePair, owner, page = 1, perPage = 20, user }) {
  const normalizedPage = Math.max(Number(page || 1), 1)
  const normalizedPerPage = Math.min(Math.max(Number(perPage || 20), 1), 100)
  const skip = (normalizedPage - 1) * normalizedPerPage
  const filters = {}

  if (languagePair) {
    const pair = await resolveLanguagePairSlug(languagePair)
    filters.languagePair = pair._id
  }

  if (owner === 'me') {
    filters.owner = userId(user)
  } else {
    filters.$or = collectionAccessConditions(user)
  }

  const [total, collections] = await Promise.all([
    Collection.countDocuments(filters),
    Collection.find(filters)
      .populate(['languagePair', 'group', 'owner'])
      .sort({ order: 1 })
      .skip(skip)
      .limit(normalizedPerPage),
  ])

  const sortedCollections = [...collections]
    .sort((left, right) => {
      const leftGroupOrder = left.group?.order ?? Number.MAX_SAFE_INTEGER
      const rightGroupOrder = right.group?.order ?? Number.MAX_SAFE_INTEGER

      if (leftGroupOrder !== rightGroupOrder) {
        return leftGroupOrder - rightGroupOrder
      }

      return (left.order ?? 0) - (right.order ?? 0)
    })

  return {
    collections: sortedCollections.map(collection => serializeCollection(collection, user)),
    meta: {
      total,
      page: normalizedPage,
      perPage: normalizedPerPage,
    },
  }
}

async function getCollectionDocument(id, user) {
  const collection = await Collection.findOne(accessibleCollectionFilter(id, user))

  if (!collection) {
    throw collectionNotFoundError()
  }

  return collection
}

async function getCollection(id, user) {
  const collection = await Collection.findOne(accessibleCollectionFilter(id, user))

  if (!collection) {
    throw collectionNotFoundError()
  }

  if (collection.populate) {
    await collection.populate(['languagePair', 'group', 'owner'])
  }

  return serializeCollection(collection, user)
}

function buildSentenceQuery({ collectionId, query, context }) {
  const filters = { collection: collectionId }

  if (query) {
    const field = context === 'translation' ? 'translation' : context === 'cloze' ? 'cloze' : 'text'
    filters[field] = { $regex: query, $options: 'i' }
  }

  return filters
}

function serializeSentence(sentence) {
  return {
    id: sentence.id,
    text: sentence.text,
    translation: sentence.translation,
    cloze: sentence.cloze,
    alternativeAnswers: sentence.alternativeAnswers,
    multipleChoiceOptions: sentence.multipleChoiceOptions,
    hint: sentence.hint,
    notes: sentence.notes,
  }
}

async function createCollection(payload, user) {
  const name = String(payload.name || '').trim()
  const baseSlug = slugify(payload.slug || name)
  const id = userId(user)

  if (!name || !baseSlug) {
    throw validationError('Collection name is required.', [{ field: 'name', message: 'Collection name is required.' }])
  }

  const pair = payload.languagePairSlug
    ? await LanguagePair.findOne({ slug: payload.languagePairSlug, active: true })
    : await resolveActiveLanguagePair(user)

  if (!pair) {
    throw languagePairNotFoundError('No active language pair is available.')
  }

  const slug = await uniqueCollectionSlug(pair._id, baseSlug)

  const collection = await Collection.create({
    owner: id,
    languagePair: pair._id,
    name,
    slug,
    description: payload.description || '',
    type: payload.type || 'topic',
    level: payload.level || '',
    isOfficial: false,
    isPublic: payload.isPublic ?? false,
    order: payload.order || 0,
  })

  await User.findByIdAndUpdate(id, { $addToSet: { pinnedCollections: collection._id } })

  collection.languagePair = pair

  return serializeCollection(collection, userWithPinnedCollection(user, collection._id))
}

async function uniqueCollectionSlug(languagePairId, baseSlug) {
  let candidate = baseSlug
  let suffix = 2

  while (await Collection.findOne({ languagePair: languagePairId, slug: candidate })) {
    candidate = `${baseSlug}-${suffix}`
    suffix += 1
  }

  return candidate
}

async function ensureOwnedCollection(collectionId, user) {
  const collection = await Collection.findOne({ _id: collectionId, owner: userId(user), isOfficial: false })

  if (!collection) {
    const existingCollection = await Collection.findOne({ _id: collectionId })

    if (existingCollection) {
      throw collectionOwnershipError()
    }

    throw collectionNotFoundError()
  }

  return collection
}

async function updateCollection(collectionId, payload, user) {
  const collection = await ensureOwnedCollection(collectionId, user)

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    const name = String(payload.name || '').trim()

    if (!name) {
      throw validationError('Collection name is required.', [
        { field: 'name', message: 'Collection name is required.' },
      ])
    }

    collection.name = name
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
    collection.description = String(payload.description || '').trim()
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'isPublic')) {
    collection.isPublic = Boolean(payload.isPublic)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'visibility')) {
    if (!['public', 'private'].includes(payload.visibility)) {
      throw invalidVisibilityError()
    }

    collection.isPublic = payload.visibility === 'public'
  }

  await collection.save()
  await collection.populate(['languagePair', 'group', 'owner'])

  return serializeCollection(collection, user)
}

async function deleteCollection(collectionId, user) {
  const collection = await ensureOwnedCollection(collectionId, user)

  await CollectionSentence.deleteMany({ collection: collection._id })
  await Collection.deleteOne({ _id: collection._id })
  await User.updateMany(
    { pinnedCollections: collection._id },
    { $pull: { pinnedCollections: collection._id } }
  )
}

async function listDashboardCollections({ languagePair, user }) {
  const pinnedIds = Array.from(pinnedCollectionIds(user))

  if (pinnedIds.length === 0) {
    return {
      collections: [],
      meta: {
        total: 0,
        page: 1,
        perPage: 0,
      },
    }
  }

  const filters = {
    _id: { $in: pinnedIds },
    $or: collectionAccessConditions(user),
  }

  if (languagePair) {
    const pair = await resolveLanguagePairSlug(languagePair)
    filters.languagePair = pair._id
  }

  const collections = await Collection.find(filters).populate(['languagePair', 'group', 'owner'])

  const collectionById = new Map(collections.map(collection => [String(collection._id), collection]))
  const sortedCollections = pinnedIds.map(id => collectionById.get(id)).filter(Boolean)

  return {
    collections: sortedCollections.map(collection => serializeCollection(collection, user)),
    meta: {
      total: sortedCollections.length,
      page: 1,
      perPage: sortedCollections.length,
    },
  }
}

async function pinDashboardCollection(collectionId, user) {
  const collection = await Collection.findOne(accessibleCollectionFilter(collectionId, user)).populate([
    'languagePair',
    'group',
    'owner',
  ])

  if (!collection) {
    throw collectionNotFoundError()
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId(user),
    { $addToSet: { pinnedCollections: collection._id } },
    { returnDocument: 'after', runValidators: true }
  )

  return serializeCollection(collection, updatedUser)
}

async function unpinDashboardCollection(collectionId, user) {
  const updatedUser = await User.findByIdAndUpdate(
    userId(user),
    { $pull: { pinnedCollections: collectionId } },
    { returnDocument: 'after', runValidators: true }
  )

  const collection = await Collection.findOne(accessibleCollectionFilter(collectionId, updatedUser || user)).populate([
    'languagePair',
    'group',
    'owner',
  ])

  return collection ? serializeCollection(collection, updatedUser || user) : null
}

async function createSentence(collectionId, payload, user) {
  const collection = await ensureOwnedCollection(collectionId, user)
  const normalized = normalizeSentencePayload(payload)

  if (!normalized.text || !normalized.translation) {
    throw validationError('Sentence text and translation are required.', [
      { field: 'text', message: 'Sentence text is required.' },
      { field: 'translation', message: 'Sentence translation is required.' },
    ])
  }

  if (!normalized.cloze) {
    throw validationError('Sentence text must contain exactly one non-empty cloze marker.', [
      { field: 'cloze', message: 'Sentence cloze is required.' },
    ])
  }

  const sentence = await CollectionSentence.create({
    owner: userId(user),
    collection: collection._id,
    text: normalized.text,
    translation: normalized.translation,
    alternativeAnswers: normalized.alternativeAnswers,
    multipleChoiceOptions: normalized.multipleChoiceOptions,
    hint: normalized.hint,
    notes: normalized.notes,
    order: payload.order ?? collection.sentenceCount,
  })

  collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collection._id })
  await collection.save()

  return serializeSentence(sentence)
}

async function updateSentence(collectionId, sentenceId, payload, user) {
  const collection = await ensureOwnedCollection(collectionId, user)
  const sentence = await CollectionSentence.findOne({ _id: sentenceId, collection: collection._id })
  const normalized = normalizeSentencePayload(payload)

  if (!sentence) {
    throw collectionNotFoundError()
  }

  if (!normalized.text || !normalized.translation) {
    throw validationError('Sentence text and translation are required.', [
      { field: 'text', message: 'Sentence text is required.' },
      { field: 'translation', message: 'Sentence translation is required.' },
    ])
  }

  if (!normalized.cloze) {
    throw validationError('Sentence text must contain exactly one non-empty cloze marker.', [
      { field: 'cloze', message: 'Sentence cloze is required.' },
    ])
  }

  sentence.text = normalized.text
  sentence.translation = normalized.translation
  sentence.alternativeAnswers = normalized.alternativeAnswers
  sentence.multipleChoiceOptions = normalized.multipleChoiceOptions
  sentence.hint = normalized.hint
  sentence.notes = normalized.notes

  await sentence.save()

  return serializeSentence(sentence)
}

async function listSentences({ collectionId, query, context, page = 1, perPage = 20, user }) {
  const collection = await getCollectionDocument(collectionId, user)
  const normalizedPage = Math.max(Number(page || 1), 1)
  const normalizedPerPage = Math.min(Math.max(Number(perPage || 20), 1), 100)
  const filters = buildSentenceQuery({ collectionId: collection._id, query, context })
  const skip = (normalizedPage - 1) * normalizedPerPage

  const [total, sentences] = await Promise.all([
    CollectionSentence.countDocuments(filters),
    CollectionSentence.find(filters).sort({ order: 1 }).skip(skip).limit(normalizedPerPage),
  ])

  return {
    sentences: sentences.map(serializeSentence),
    meta: {
      total,
      page: normalizedPage,
      perPage: normalizedPerPage,
    },
  }
}

module.exports = {
  createCollection,
  createSentence,
  deleteCollection,
  getCollection,
  listDashboardCollections,
  listCollections,
  listSentences,
  pinDashboardCollection,
  unpinDashboardCollection,
  updateCollection,
  updateSentence,
}
