#!/usr/bin/env node

const fs = require('fs/promises')
const path = require('path')
const mongoose = require('mongoose')

const dotenvOptions = { quiet: true }

if (process.env.DOTENV_CONFIG_PATH) {
  dotenvOptions.path = process.env.DOTENV_CONFIG_PATH
}

require('dotenv').config(dotenvOptions)

const Collection = require('../src/models/collection')
const CollectionGroup = require('../src/models/collection-group')
const CollectionSentence = require('../src/models/collection-sentence')
const Language = require('../src/models/language')
const LanguagePair = require('../src/models/language-pair')
const User = require('../src/models/user')

const seedPath = process.env.SEED_FILE || path.join(__dirname, '..', 'data', 'seeds', 'deu-eng.json')

async function connectDatabase() {
  if (!process.env.MONGODB_CONNECTION_STRING) {
    throw new Error('MONGODB_CONNECTION_STRING must be defined.')
  }

  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
}

async function readSeedFile() {
  const fileContents = await fs.readFile(seedPath, 'utf8')
  return JSON.parse(fileContents)
}

async function resolveSeedOwner() {
  if (!process.env.ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL must be defined.')
  }

  const admin = await User.findOne({ email: process.env.ADMIN_EMAIL.trim().toLowerCase() })

  if (!admin) {
    throw new Error(`Admin user not found: ${process.env.ADMIN_EMAIL}`)
  }

  if (admin.role !== 'admin') {
    throw new Error(`User is not an admin: ${process.env.ADMIN_EMAIL}`)
  }

  return admin
}

async function upsertLanguages(languages = []) {
  const results = []

  for (const language of languages) {
    const existing = await Language.findOne({ $or: [{ code: language.code }, { iso3: language.iso3 }] })

    if (existing) {
      existing.set(language)
      results.push(await existing.save())
    } else {
      results.push(await Language.create(language))
    }
  }

  return results
}

async function findLanguage(identifier) {
  return Language.findOne({ $or: [{ iso3: identifier }, { code: identifier }] })
}

async function upsertLanguagePairs(languagePairs = []) {
  const results = []

  for (const pair of languagePairs) {
    const targetLanguageIdentifier = pair.targetLanguageIso3 || pair.targetLanguageCode
    const baseLanguageIdentifier = pair.baseLanguageIso3 || pair.baseLanguageCode
    const [targetLanguage, baseLanguage] = await Promise.all([
      findLanguage(targetLanguageIdentifier),
      findLanguage(baseLanguageIdentifier),
    ])

    if (!targetLanguage) {
      throw new Error(`Language not found: ${targetLanguageIdentifier}`)
    }

    if (!baseLanguage) {
      throw new Error(`Language not found: ${baseLanguageIdentifier}`)
    }

    results.push(
      await LanguagePair.findOneAndUpdate(
        { slug: pair.slug },
        {
          slug: pair.slug,
          targetLanguage: targetLanguage._id,
          baseLanguage: baseLanguage._id,
          name: pair.name,
          active: pair.active ?? true,
          totalSentences: pair.totalSentences || 0,
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      )
    )
  }

  return results
}

async function upsertCollections(collectionsSeed = {}, owner) {
  const pair = await LanguagePair.findOne({ slug: collectionsSeed.languagePairSlug })

  if (!pair) {
    throw new Error(`Language pair not found: ${collectionsSeed.languagePairSlug}`)
  }

  const groupsByType = new Map()
  const groups = []

  for (const group of collectionsSeed.groups || []) {
    const savedGroup = await CollectionGroup.findOneAndUpdate(
      { languagePair: pair._id, type: group.type },
      { ...group, languagePair: pair._id },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    )

    groupsByType.set(savedGroup.type, savedGroup)
    groups.push(savedGroup)
  }

  const collections = []

  for (const collection of collectionsSeed.collections || []) {
    const { groupType, ...collectionFields } = collection
    const group = groupType ? groupsByType.get(groupType) : null

    collections.push(
      await Collection.findOneAndUpdate(
        { languagePair: pair._id, slug: collection.slug },
        {
          ...collectionFields,
          owner: owner._id,
          languagePair: pair._id,
          group: group?._id || null,
          isOfficial: collection.isOfficial ?? true,
          isPublic: collection.isPublic ?? true,
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      )
    )
  }

  return { pair, groups, collections }
}

async function upsertSentences(pair, sentencesByCollectionSlug = {}, owner) {
  let totalSentences = 0

  for (const [collectionSlug, sentences] of Object.entries(sentencesByCollectionSlug)) {
    const collection = await Collection.findOne({ languagePair: pair._id, slug: collectionSlug })

    if (!collection) {
      throw new Error(`Collection not found: ${collectionSlug}`)
    }

    for (const [index, sentence] of sentences.entries()) {
      await CollectionSentence.findOneAndUpdate(
        { collection: collection._id, text: sentence.text, cloze: sentence.cloze },
        {
          ...sentence,
          collection: collection._id,
          owner: owner._id,
          order: sentence.order ?? index,
        },
        { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
      )
    }

    collection.sentenceCount = await CollectionSentence.countDocuments({ collection: collection._id })
    await collection.save()
    totalSentences += collection.sentenceCount
  }

  pair.totalSentences = totalSentences
  await pair.save()

  return totalSentences
}

async function main() {
  await connectDatabase()

  const seed = await readSeedFile()
  const owner = await resolveSeedOwner()
  const languages = await upsertLanguages(seed.languages)
  const languagePairs = await upsertLanguagePairs(seed.languagePairs)
  const { pair, groups, collections } = await upsertCollections(seed.collections, owner)
  const totalSentences = await upsertSentences(pair, seed.sentencesByCollectionSlug, owner)

  console.log(`Seeded ${seedPath}`)
  console.log(`Owner: ${owner.email}`)
  console.log(`Languages: ${languages.length}`)
  console.log(`Language pairs: ${languagePairs.length}`)
  console.log(`Groups: ${groups.length}`)
  console.log(`Collections: ${collections.length}`)
  console.log(`Sentences: ${totalSentences}`)
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
