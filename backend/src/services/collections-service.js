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
  getCollection,
  listCollectionsBySlug,
  listCollectionsForUser,
  listSentences,
}
