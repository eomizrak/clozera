const app = require('../../app')
const Collection = require('../../models/collection')
const CollectionGroup = require('../../models/collection-group')
const CollectionSentence = require('../../models/collection-sentence')
const Language = require('../../models/language')
const LanguagePair = require('../../models/language-pair')
const { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } = require('../../test-utils/test-database')
const { loginAs } = require('../../test-utils/auth')

describe('collections integration', () => {
  beforeAll(async () => {
    await connectTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  async function seedCollection() {
    const german = await Language.create({
      code: 'de',
      iso3: 'deu',
      name: 'German',
      nativeName: 'Deutsch',
      flagIso: 'de',
      ttsLocale: 'de-DE',
    })
    const english = await Language.create({
      code: 'en',
      iso3: 'eng',
      name: 'English',
      nativeName: 'English',
      flagIso: 'gb',
      ttsLocale: 'en-US',
    })
    const pair = await LanguagePair.create({
      slug: 'deu-eng',
      targetLanguage: german._id,
      baseLanguage: english._id,
      name: 'German from English',
      active: true,
    })
    const group = await CollectionGroup.create({
      languagePair: pair._id,
      name: 'Fast Track',
      type: 'fast_track',
      order: 1,
    })
    const collection = await Collection.create({
      languagePair: pair._id,
      group: group._id,
      name: 'Fast Track Level 1',
      slug: 'fast-track-level-1',
      type: 'fast_track',
      level: 'A1',
      sentenceCount: 2,
      order: 1,
    })

    await CollectionSentence.create([
      {
        collection: collection._id,
        text: 'Ich {{bin}} hier.',
        translation: 'I am here.',
        cloze: 'bin',
        multipleChoiceOptions: ['bin', 'bist', 'ist'],
        order: 1,
      },
      {
        collection: collection._id,
        text: 'Das ist {{gut}}.',
        translation: 'That is good.',
        cloze: 'gut',
        multipleChoiceOptions: ['gut', 'rot', 'klein'],
        order: 2,
      },
    ])

    return { collection, group, pair }
  }

  it('lists collections for a language pair', async () => {
    await seedCollection()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const response = await agent.get('/language-pairs/deu-eng/collections')

    expect(response.status).toBe(200)
    expect(response.body.data).toHaveLength(1)
    expect(response.body.data[0]).toMatchObject({
      name: 'Fast Track Level 1',
      slug: 'fast-track-level-1',
      sentenceCount: 2,
    })
  })

  it('lists paginated collection sentences without progress data', async () => {
    const { collection } = await seedCollection()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const response = await agent.get(`/collections/${collection._id}/sentences`).query({
      page: 1,
      perPage: 1,
    })

    expect(response.status).toBe(200)
    expect(response.body.meta).toEqual({
      total: 2,
      page: 1,
      perPage: 1,
    })
    expect(response.body.data.sentences).toHaveLength(1)
    expect(response.body.data.sentences[0]).toMatchObject({
      text: 'Ich {{bin}} hier.',
      translation: 'I am here.',
      cloze: 'bin',
    })
    expect(response.body.data.sentences[0]).not.toHaveProperty('progress')
  })

  it('does not expose private collections to other authenticated users', async () => {
    const { collection } = await seedCollection()
    await Collection.findByIdAndUpdate(collection._id, {
      isPublic: false,
      owner: null,
    })
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const collectionResponse = await agent.get(`/collections/${collection._id}`)
    const sentencesResponse = await agent.get(`/collections/${collection._id}/sentences`)

    expect(collectionResponse.status).toBe(404)
    expect(collectionResponse.body.error.code).toBe('NOT_FOUND')
    expect(sentencesResponse.status).toBe(404)
    expect(sentencesResponse.body.error.code).toBe('NOT_FOUND')
  })

  it('builds a dashboard for an authenticated user', async () => {
    const { group } = await seedCollection()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    await agent.patch('/users/me/language-pair').send({
      languagePairSlug: 'deu-eng',
    })

    const response = await agent.get('/users/me/dashboard')

    expect(response.status).toBe(200)
    expect(response.body.data.languagePair).toMatchObject({
      slug: 'deu-eng',
      name: 'German from English',
    })
    expect(response.body.data.collectionGroups).toMatchObject([
      {
        id: String(group._id),
        name: 'Fast Track',
      },
    ])
    expect(response.body.data.collections[0]).toMatchObject({
      name: 'Fast Track Level 1',
      numSentences: 2,
    })
    expect(response.body.data.collections[0]).not.toHaveProperty('numReadyForReview')
  })
})
