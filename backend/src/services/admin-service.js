import Collection from '../models/collection.js'
import CollectionGroup from '../models/collection-group.js'
import CollectionSentence from '../models/collection-sentence.js'
import Language from '../models/language.js'
import LanguagePair from '../models/language-pair.js'
import {
  collectionGroupImportDocument,
  collectionImportDocument,
  normalizeImportSentences,
  resolveImportOwner,
  resolveLanguagePairImport,
} from '../lib/admin-import-pipeline.js'

function collectionNotFoundError() {
  const error = new Error('Collection not found.')
  error.status = 404
  error.code = 'NOT_FOUND'
  return error
}

async function importLanguages(languages = []) {
  return Language.insertMany(languages, { ordered: false })
}

async function importLanguagePairs(languagePairs = []) {
  const createdPairs = []

  for (const pair of languagePairs) {
    createdPairs.push(await LanguagePair.create(await resolveLanguagePairImport(pair)))
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
    createdGroups.push(await CollectionGroup.create(collectionGroupImportDocument(group, pair)))
  }

  const groupByType = new Map(createdGroups.map(group => [group.type, group._id]))
  const createdCollections = []

  for (const collection of collections) {
    createdCollections.push(await Collection.create(collectionImportDocument(collection, { pair, owner, groupByType })))
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

  const normalizedSentences = normalizeImportSentences(sentences, { collectionId, owner })

  const createdSentences = await CollectionSentence.insertMany(normalizedSentences)

  collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collectionId })
  await collection.save()

  return createdSentences
}

export { importCollectionSentences, importCollections, importLanguagePairs, importLanguages }
