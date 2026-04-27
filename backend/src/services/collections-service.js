const Collection = require('../models/collection')
const CollectionSentence = require('../models/collection-sentence')
const LanguagePair = require('../models/language-pair')
const { resolveActiveLanguagePair } = require('../lib/active-language-pair')

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

function validationError(message, details = []) {
  const error = new Error(message)
  error.status = 400
  error.code = 'VALIDATION_ERROR'
  error.details = details
  return error
}

function userId(user) {
  return user?._id || user?.id
}

function collectionAccessConditions(user) {
  const id = userId(user)
  return id ? [{ isPublic: true }, { owner: id }] : [{ isPublic: true }]
}

function accessibleCollectionFilter(collectionId, user) {
  return {
    _id: collectionId,
    $or: collectionAccessConditions(user),
  }
}

async function collectionsForPair(pair, user) {
  return Collection.find({ languagePair: pair._id, $or: collectionAccessConditions(user) }).sort({ order: 1 })
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function listCollectionsBySlug(slug, user) {
  const pair = await LanguagePair.findOne({ slug })

  if (!pair) {
    throw languagePairNotFoundError()
  }

  return collectionsForPair(pair, user)
}

async function listCollectionsForUser(user) {
  const pair = await resolveActiveLanguagePair(user)

  if (!pair) {
    throw languagePairNotFoundError('No active language pair is available.')
  }

  return collectionsForPair(pair, user)
}

async function getCollection(id, user) {
  const collection = await Collection.findOne(accessibleCollectionFilter(id, user))

  if (!collection) {
    throw collectionNotFoundError()
  }

  return collection
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

  return Collection.create({
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
  const collection = await Collection.findOne({ _id: collectionId, owner: userId(user) })

  if (!collection) {
    const accessibleCollection = await Collection.findOne(accessibleCollectionFilter(collectionId, user))

    if (accessibleCollection) {
      throw collectionOwnershipError()
    }

    throw collectionNotFoundError()
  }

  return collection
}

async function createSentence(collectionId, payload, user) {
  const collection = await ensureOwnedCollection(collectionId, user)
  const text = String(payload.text || '').trim()
  const translation = String(payload.translation || '').trim()
  const cloze = String(payload.cloze || '').trim()

  if (!text || !translation || !cloze) {
    throw validationError('Sentence text, translation, and cloze are required.', [
      { field: 'text', message: 'Sentence text is required.' },
      { field: 'translation', message: 'Sentence translation is required.' },
      { field: 'cloze', message: 'Sentence cloze is required.' },
    ])
  }

  const sentence = await CollectionSentence.create({
    owner: userId(user),
    collection: collection._id,
    text,
    translation,
    cloze,
    alternativeAnswers: payload.alternativeAnswers || [],
    multipleChoiceOptions: payload.multipleChoiceOptions || [],
    hint: payload.hint || '',
    notes: payload.notes || '',
    order: payload.order ?? collection.sentenceCount,
  })

  collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collection._id })
  await collection.save()

  return serializeSentence(sentence)
}

async function listSentences({ collectionId, query, context, page = 1, perPage = 20, user }) {
  const collection = await getCollection(collectionId, user)
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
  getCollection,
  listCollectionsBySlug,
  listCollectionsForUser,
  listSentences,
}
