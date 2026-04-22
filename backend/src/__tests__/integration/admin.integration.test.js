const app = require('../../app')
const Collection = require('../../models/collection')
const CollectionSentence = require('../../models/collection-sentence')
const Language = require('../../models/language')
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

    const response = await agent.post('/admin/languages/import').send({
      languages: [],
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

  it('seeds the German-English starter data', async () => {
    const { agent } = await loginAs(app, {
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin',
    })

    const response = await agent.post('/admin/seed/deu-eng')

    expect(response.status).toBe(201)
    expect(response.body.data.pair.slug).toBe('deu-eng')
    expect(await Collection.countDocuments()).toBe(1)
    expect(await CollectionSentence.countDocuments()).toBe(3)
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
