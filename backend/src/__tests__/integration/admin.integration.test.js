const app = require('../../app')
const Collection = require('../../models/collection')
const CollectionSentence = require('../../models/collection-sentence')
const Language = require('../../models/language')
const LanguagePair = require('../../models/language-pair')
const { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } = require('../../test-utils/test-database')
const { loginAs } = require('../../test-utils/auth')

describe('admin integration', () => {
  beforeAll(async () => {
    await connectTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  it('rejects admin imports for regular users', async () => {
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const response = await agent.post('/admin/language-pairs/import').send({
      languagePairs: [],
    })

    expect(response.status).toBe(403)
    expect(response.body.error.code).toBe('FORBIDDEN')
  })

  it('lets admins import languages', async () => {
    const { agent } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    const response = await agent.post('/admin/languages/import').send({
      languages: [
        {
          code: 'de',
          iso3: 'deu',
          name: 'German',
          nativeName: 'Deutsch',
          flagIso: 'de',
          ttsLocale: 'de-DE',
        },
      ],
    })

    expect(response.status).toBe(201)
    expect(response.body.data).toHaveLength(1)
    expect(await Language.countDocuments()).toBe(1)
  })

  it('lets admins import language pairs', async () => {
    const { agent } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    await agent.post('/admin/languages/import').send({
      languages: [
        {
          code: 'de',
          iso3: 'deu',
          name: 'German',
          nativeName: 'Deutsch',
          flagIso: 'de',
          ttsLocale: 'de-DE',
        },
        {
          code: 'en',
          iso3: 'eng',
          name: 'English',
          nativeName: 'English',
          flagIso: 'gb',
          ttsLocale: 'en-US',
        },
      ],
    })

    const response = await agent.post('/admin/language-pairs/import').send({
      languagePairs: [
        {
          slug: 'deu-eng',
          targetLanguageIso3: 'deu',
          baseLanguageIso3: 'eng',
          name: 'German from English',
        },
      ],
    })

    expect(response.status).toBe(201)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0]).toMatchObject({
      slug: 'deu-eng',
      name: 'German from English',
      active: true,
    })
    expect(await LanguagePair.countDocuments()).toBe(1)
  })

  it('imports starter content through the admin import pipeline', async () => {
    const { agent, user } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    await agent.post('/admin/languages/import').send({
      languages: [
        {
          code: 'de',
          iso3: 'deu',
          name: 'German',
          nativeName: 'Deutsch',
          flagIso: 'de',
          ttsLocale: 'de-DE',
        },
        {
          code: 'en',
          iso3: 'eng',
          name: 'English',
          nativeName: 'English',
          flagIso: 'gb',
          ttsLocale: 'en-US',
        },
      ],
    })
    await agent.post('/admin/language-pairs/import').send({
      languagePairs: [
        {
          slug: 'deu-eng',
          targetLanguageIso3: 'deu',
          baseLanguageIso3: 'eng',
          name: 'German from English',
        },
      ],
    })
    const collectionsResponse = await agent.post('/admin/collections/import').send({
      languagePairSlug: 'deu-eng',
      groups: [
        {
          name: 'Fluency Fast Track',
          type: 'fast_track',
          description: 'Starter sentences for the first MVP loop.',
          order: 1,
        },
      ],
      collections: [
        {
          groupType: 'fast_track',
          name: 'Fast Track Level 1',
          slug: 'fast-track-level-1',
          description: 'A tiny starter set for validating play and review.',
          type: 'fast_track',
          level: 'A1',
          order: 1,
        },
      ],
    })
    const collectionId = collectionsResponse.body.data.collections[0]._id
    const sentencesResponse = await agent.post(`/admin/collections/${collectionId}/sentences/import`).send({
      sentences: [
        {
          text: 'Wer {{weiss}}?',
          translation: 'Who knows?',
          cloze: 'weiss',
          alternativeAnswers: ['weiss'],
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
      ],
    })

    expect(collectionsResponse.status).toBe(201)
    expect(sentencesResponse.status).toBe(201)
    expect(sentencesResponse.body.data).toHaveLength(3)
    expect(await LanguagePair.countDocuments()).toBe(1)
    expect(await Collection.countDocuments()).toBe(1)
    expect(await CollectionSentence.countDocuments()).toBe(3)
    expect(String((await Collection.findById(collectionId)).owner)).toBe(String(user._id))
    expect(String((await CollectionSentence.findOne({ collection: collectionId })).owner)).toBe(String(user._id))
  })

  it('rejects language pair imports when a referenced language is missing', async () => {
    const { agent } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    const response = await agent.post('/admin/language-pairs/import').send({
      languagePairs: [
        {
          slug: 'deu-eng',
          targetLanguageIso3: 'deu',
          baseLanguageIso3: 'eng',
          name: 'German from English',
        },
      ],
    })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('LANGUAGE_NOT_FOUND')
    expect(await LanguagePair.countDocuments()).toBe(0)
  })

  it('rejects sentence imports for missing collections without creating orphan sentences', async () => {
    const { agent } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })
    const missingCollectionId = new Collection()._id

    const response = await agent.post(`/admin/collections/${missingCollectionId}/sentences/import`).send({
      sentences: [
        {
          text: 'Ich {{bin}} hier.',
          translation: 'I am here.',
          cloze: 'bin',
        },
      ],
    })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
    expect(await CollectionSentence.countDocuments()).toBe(0)
  })
})
