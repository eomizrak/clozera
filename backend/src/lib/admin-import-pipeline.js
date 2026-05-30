const mongoose = require('mongoose')

const Language = require('../models/language')
const User = require('../models/user')
const { normalizeSentencePayload } = require('./sentence-authoring')

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

function validationError(message, details = []) {
  const error = new Error(message)
  error.status = 400
  error.code = 'VALIDATION_ERROR'
  error.details = details
  return error
}

async function resolveImportOwner(ownerId, { UserModel = User, isValidObjectId = mongoose.isValidObjectId } = {}) {
  if (!ownerId) {
    throw ownerRequiredError()
  }

  if (!isValidObjectId(ownerId)) {
    throw ownerNotFoundError(ownerId)
  }

  const user = await UserModel.findById(ownerId)

  if (!user) {
    throw ownerNotFoundError(ownerId)
  }

  return user
}

async function findLanguage(identifier, { LanguageModel = Language } = {}) {
  return LanguageModel.findOne({ $or: [{ iso3: identifier }, { code: identifier }] })
}

async function resolveLanguagePairImport(pair, adapters = {}) {
  const targetLanguageIdentifier = pair.targetLanguageIso3 || pair.targetLanguageCode
  const baseLanguageIdentifier = pair.baseLanguageIso3 || pair.baseLanguageCode
  const [targetLanguage, baseLanguage] = await Promise.all([
    findLanguage(targetLanguageIdentifier, adapters),
    findLanguage(baseLanguageIdentifier, adapters),
  ])

  if (!targetLanguage) {
    throw languageNotFoundError(targetLanguageIdentifier)
  }

  if (!baseLanguage) {
    throw languageNotFoundError(baseLanguageIdentifier)
  }

  return {
    slug: pair.slug,
    targetLanguage: targetLanguage._id,
    baseLanguage: baseLanguage._id,
    name: pair.name,
    active: pair.active ?? true,
    totalSentences: pair.totalSentences || 0,
  }
}

function collectionGroupImportDocument(group, pair) {
  return {
    ...group,
    languagePair: pair._id,
  }
}

function collectionImportDocument(collection, { pair, owner, groupByType }) {
  const { groupType, ...collectionFields } = collection

  return {
    ...collectionFields,
    owner: owner._id,
    languagePair: pair._id,
    group: groupType ? groupByType.get(groupType) : null,
  }
}

function normalizeImportSentences(sentences = [], { collectionId, owner }) {
  return sentences.map((sentence, index) => {
    const normalized = normalizeSentencePayload(sentence)

    if (!normalized.cloze) {
      throw validationError('Sentence text must contain exactly one non-empty cloze marker.', [
        { field: `sentences.${index}.cloze`, message: 'Sentence cloze is required.' },
      ])
    }

    return {
      ...sentence,
      ...normalized,
      owner: owner._id,
      collection: collectionId,
      order: sentence.order ?? index,
    }
  })
}

module.exports = {
  collectionGroupImportDocument,
  collectionImportDocument,
  findLanguage,
  normalizeImportSentences,
  resolveImportOwner,
  resolveLanguagePairImport,
  validationError,
}
