const request = require('supertest')

const app = require('../../app')
const Language = require('../../models/language')
const LanguagePair = require('../../models/language-pair')
const { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } = require('../../test-utils/test-database')
const { loginAs } = require('../../test-utils/auth')

describe('languages integration', () => {
  beforeAll(async () => {
    await connectTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  async function seedLanguagePair() {
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

    return { english, german, pair }
  }

  it('lists languages and active language pairs', async () => {
    await seedLanguagePair()

    const languagesResponse = await request(app).get('/languages')
    const pairsResponse = await request(app).get('/language-pairs')

    expect(languagesResponse.status).toBe(200)
    expect(languagesResponse.body.data).toMatchObject([
      { code: 'en', name: 'English' },
      { code: 'de', name: 'German' },
    ])

    expect(pairsResponse.status).toBe(200)
    expect(pairsResponse.body.data).toHaveLength(1)
    expect(pairsResponse.body.data[0]).toMatchObject({
      slug: 'deu-eng',
      name: 'German from English',
      targetLanguage: {
        code: 'de',
      },
      baseLanguage: {
        code: 'en',
      },
    })
  })

  it('lets an authenticated user select a language pair through current user update', async () => {
    const { pair } = await seedLanguagePair()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const response = await agent.patch('/users/me').send({
      selectedLanguagePairSlug: 'deu-eng',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.selectedLanguagePair).toMatchObject({
      slug: 'deu-eng',
    })
    expect(response.body.data.selectedLanguagePair.id).toBe(String(pair._id))
    expect(response.body.data.languagePairs).toHaveLength(1)
    expect(response.body.data.languagePairs[0]).toMatchObject({
      id: String(pair._id),
      slug: 'deu-eng',
    })
  })

  it('does not duplicate a language pair when selected more than once', async () => {
    const { pair } = await seedLanguagePair()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    await agent.patch('/users/me').send({
      selectedLanguagePairSlug: 'deu-eng',
    })
    const response = await agent.patch('/users/me').send({
      selectedLanguagePairSlug: 'deu-eng',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.selectedLanguagePair.id).toBe(String(pair._id))
    expect(response.body.data.languagePairs).toHaveLength(1)
    expect(response.body.data.languagePairs[0].id).toBe(String(pair._id))
  })

  it('rejects current user update when the user is not authenticated', async () => {
    await seedLanguagePair()

    const response = await request(app).patch('/users/me').send({
      selectedLanguagePairSlug: 'deu-eng',
    })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('rejects missing selected language pair slugs', async () => {
    await seedLanguagePair()
    const { agent } = await loginAs(app, {
      username: 'ada',
      email: 'ada@example.com',
    })

    const response = await agent.patch('/users/me').send({
      selectedLanguagePairSlug: 'missing',
    })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('LANGUAGE_PAIR_NOT_FOUND')
  })
})
