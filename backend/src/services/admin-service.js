const mongoose = require('mongoose')

const Collection = require('../models/collection')
const CollectionGroup = require('../models/collection-group')
const CollectionSentence = require('../models/collection-sentence')
const Language = require('../models/language')
const LanguagePair = require('../models/language-pair')
const User = require('../models/user')

function collectionNotFoundError() {
  const error = new Error('Collection not found.')
  error.status = 404
  error.code = 'NOT_FOUND'
  return error
}

function languageNotFoundError(identifier) {
  const error = new Error(`Language not found: ${identifier}`)
  error.status = 404
  error.code = 'LANGUAGE_NOT_FOUND'
  return error
}

function ownerRequiredError() {
  const error = new Error('Owner id is required for content imports.')
  error.status = 400
  error.code = 'OWNER_REQUIRED'
  return error
}

function ownerNotFoundError(ownerId) {
  const error = new Error(`Owner not found: ${ownerId}`)
  error.status = 404
  error.code = 'OWNER_NOT_FOUND'
  return error
}

async function resolveImportOwner(ownerId) {
  if (!ownerId) {
    throw ownerRequiredError()
  }

  if (!mongoose.isValidObjectId(ownerId)) {
    throw ownerNotFoundError(ownerId)
  }

  const user = await User.findById(ownerId)

  if (!user) {
    throw ownerNotFoundError(ownerId)
  }

  return user
}

async function importLanguages(languages = []) {
  return Language.insertMany(languages, { ordered: false })
}

async function findLanguage(identifier) {
  return Language.findOne({ $or: [{ iso3: identifier }, { code: identifier }] })
}

async function importLanguagePairs(languagePairs = []) {
  const createdPairs = []

  for (const pair of languagePairs) {
    const targetLanguageIdentifier = pair.targetLanguageIso3 || pair.targetLanguageCode
    const baseLanguageIdentifier = pair.baseLanguageIso3 || pair.baseLanguageCode
    const [targetLanguage, baseLanguage] = await Promise.all([
      findLanguage(targetLanguageIdentifier),
      findLanguage(baseLanguageIdentifier),
    ])

    if (!targetLanguage) {
      throw languageNotFoundError(targetLanguageIdentifier)
    }

    if (!baseLanguage) {
      throw languageNotFoundError(baseLanguageIdentifier)
    }

    createdPairs.push(
      await LanguagePair.create({
        slug: pair.slug,
        targetLanguage: targetLanguage._id,
        baseLanguage: baseLanguage._id,
        name: pair.name,
        active: pair.active ?? true,
        totalSentences: pair.totalSentences || 0,
      })
    )
  }

  return createdPairs
}

async function importCollections({ languagePairSlug, ownerId, groups = [], collections = [] }) {
  const [pair, owner] = await Promise.all([
    LanguagePair.findOne({ slug: languagePairSlug }),
    resolveImportOwner(ownerId),
  ])

  if (!pair) {
    return null
  }

  const createdGroups = []
  for (const group of groups) {
    createdGroups.push(await CollectionGroup.create({ ...group, languagePair: pair._id }))
  }

  const groupByType = new Map(createdGroups.map(group => [group.type, group._id]))
  const createdCollections = []

  for (const collection of collections) {
    const { groupType, ...collectionFields } = collection

    createdCollections.push(
      await Collection.create({
        ...collectionFields,
        owner: owner._id,
        languagePair: pair._id,
        group: groupType ? groupByType.get(groupType) : null,
      })
    )
  }

  return {
    groups: createdGroups,
    collections: createdCollections,
  }
}

async function importCollectionSentences(collectionId, sentences = [], ownerId) {
  const [collection, owner] = await Promise.all([Collection.findById(collectionId), resolveImportOwner(ownerId)])

  if (!collection) {
    throw collectionNotFoundError()
  }

  const createdSentences = await CollectionSentence.insertMany(
    sentences.map((sentence, index) => ({
      ...sentence,
      owner: owner._id,
      collection: collectionId,
      order: sentence.order ?? index,
    }))
  )

  collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collectionId })
  await collection.save()

  return createdSentences
}

module.exports = {
  importCollectionSentences,
  importCollections,
  importLanguagePairs,
  importLanguages,
}
