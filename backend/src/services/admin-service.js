const Collection = require('../models/collection')
const CollectionGroup = require('../models/collection-group')
const CollectionSentence = require('../models/collection-sentence')
const Language = require('../models/language')
const LanguagePair = require('../models/language-pair')

function collectionNotFoundError() {
  const error = new Error('Collection not found.')
  error.status = 404
  error.code = 'NOT_FOUND'
  return error
}

async function importLanguages(languages = []) {
  return Language.insertMany(languages, { ordered: false })
}

async function importCollections({ languagePairSlug, groups = [], collections = [] }) {
  const pair = await LanguagePair.findOne({ slug: languagePairSlug })

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
    createdCollections.push(
      await Collection.create({
        ...collection,
        languagePair: pair._id,
        group: collection.groupType ? groupByType.get(collection.groupType) : null,
      })
    )
  }

  return {
    groups: createdGroups,
    collections: createdCollections,
  }
}

async function importCollectionSentences(collectionId, sentences = []) {
  const collection = await Collection.findById(collectionId)

  if (!collection) {
    throw collectionNotFoundError()
  }

  const createdSentences = await CollectionSentence.insertMany(
    sentences.map((sentence, index) => ({
      ...sentence,
      collection: collectionId,
      order: sentence.order ?? index,
    }))
  )

  collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collectionId })
  await collection.save()

  return createdSentences
}

async function seedGermanEnglish() {
  const [german, english] = await Promise.all([
    Language.findOneAndUpdate(
      { iso3: 'deu' },
      {
        code: 'de',
        iso3: 'deu',
        name: 'German',
        nativeName: 'Deutsch',
        flagIso: 'de',
        ttsLocale: 'de-DE',
      },
      { upsert: true, returnDocument: 'after' }
    ),
    Language.findOneAndUpdate(
      { iso3: 'eng' },
      {
        code: 'en',
        iso3: 'eng',
        name: 'English',
        nativeName: 'English',
        flagIso: 'gb',
        ttsLocale: 'en-US',
      },
      { upsert: true, returnDocument: 'after' }
    ),
  ])

  const pair = await LanguagePair.findOneAndUpdate(
    { slug: 'deu-eng' },
    {
      slug: 'deu-eng',
      targetLanguage: german._id,
      baseLanguage: english._id,
      name: 'German from English',
      active: true,
    },
    { upsert: true, returnDocument: 'after' }
  )

  const group = await CollectionGroup.findOneAndUpdate(
    { languagePair: pair._id, type: 'fast_track' },
    {
      languagePair: pair._id,
      name: 'Fluency Fast Track',
      type: 'fast_track',
      description: 'Starter sentences for the first MVP loop.',
      order: 1,
    },
    { upsert: true, returnDocument: 'after' }
  )

  const collection = await Collection.findOneAndUpdate(
    { languagePair: pair._id, slug: 'fast-track-level-1' },
    {
      languagePair: pair._id,
      group: group._id,
      name: 'Fast Track Level 1',
      slug: 'fast-track-level-1',
      description: 'A tiny starter set for validating play and review.',
      type: 'fast_track',
      level: 'A1',
      order: 1,
    },
    { upsert: true, returnDocument: 'after' }
  )

  const seedSentences = [
    {
      text: 'Wer {{weiss}}?',
      translation: 'Who knows?',
      cloze: 'weiss',
      alternativeAnswers: ['weiss', 'weiß'],
      multipleChoiceOptions: ['spricht', 'weiss', 'spielt', 'kocht'],
    },
    {
      text: 'Ich {{bin}} hier.',
      translation: 'I am here.',
      cloze: 'bin',
      alternativeAnswers: [],
      multipleChoiceOptions: ['bist', 'bin', 'ist', 'sind'],
    },
    {
      text: 'Das ist {{gut}}.',
      translation: 'That is good.',
      cloze: 'gut',
      alternativeAnswers: [],
      multipleChoiceOptions: ['gut', 'gross', 'klein', 'rot'],
    },
  ]

  await CollectionSentence.deleteMany({ collection: collection._id })
  await CollectionSentence.insertMany(
    seedSentences.map((sentence, index) => ({
      ...sentence,
      collection: collection._id,
      order: index + 1,
    }))
  )

  collection.sentenceCount = seedSentences.length
  await collection.save()

  return { pair, group, collection }
}

module.exports = {
  importCollectionSentences,
  importCollections,
  importLanguages,
  seedGermanEnglish,
}
