const Collection = require('../models/collection')
const CollectionGroup = require('../models/collection-group')
const LanguagePair = require('../models/language-pair')
const { resolveActiveLanguagePair } = require('../lib/active-language-pair')

function languagePairNotFoundError(message = 'Language pair not found.') {
  const error = new Error(message)
  error.status = 404
  error.code = 'LANGUAGE_PAIR_NOT_FOUND'
  return error
}

function serializeCollection(collection) {
  return {
    id: collection.id,
    groupId: collection.group,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    type: collection.type,
    level: collection.level,
    numSentences: collection.sentenceCount,
  }
}

function userId(user) {
  return user?._id || user?.id
}

function collectionAccessConditions(user) {
  const id = userId(user)
  return id ? [{ isPublic: true }, { owner: id }] : [{ isPublic: true }]
}

async function buildDashboardPayload(user, pair) {
  const [groups, collections] = await Promise.all([
    CollectionGroup.find({ languagePair: pair._id }).sort({ order: 1 }),
    Collection.find({ languagePair: pair._id, $or: collectionAccessConditions(user) }).sort({ order: 1 }),
  ])

  return {
    user: {
      id: user.id,
      username: user.username,
    },
    languagePair: {
      id: pair.id,
      slug: pair.slug,
      name: pair.name,
    },
    collectionGroups: groups.map(group => ({
      id: group.id,
      name: group.name,
      type: group.type,
      description: group.description,
      order: group.order,
    })),
    collections: collections.map(serializeCollection),
  }
}

async function getDashboard(user, slug) {
  const pair = await LanguagePair.findOne({ slug })

  if (!pair) {
    throw languagePairNotFoundError()
  }

  return buildDashboardPayload(user, pair)
}

async function getMyDashboard(user) {
  const pair = await resolveActiveLanguagePair(user)

  if (!pair) {
    throw languagePairNotFoundError('No active language pair is available.')
  }

  return buildDashboardPayload(user, pair)
}

module.exports = {
  getDashboard,
  getMyDashboard,
}
