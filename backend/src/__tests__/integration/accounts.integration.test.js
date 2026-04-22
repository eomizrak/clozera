const request = require('supertest')

const app = require('../../app')
const User = require('../../models/user')
const { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } = require('../../test-utils/test-database')

describe('accounts integration', () => {
  beforeAll(async () => {
    await connectTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  it('registers a user and creates an authenticated session', async () => {
    const agent = request.agent(app)

    const registerResponse = await agent.post('/accounts/register').send({
      name: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      password: 'secret123',
      timezone: 'Europe/Berlin',
    })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.data).toMatchObject({
      name: 'Ada Lovelace',
      username: 'ada',
      email: 'ada@example.com',
      role: 'user',
      timezone: 'Europe/Berlin',
    })
    expect(registerResponse.body.data.id).toBeDefined()

    const sessionResponse = await agent.get('/accounts/session')

    expect(sessionResponse.status).toBe(200)
    expect(sessionResponse.body.data).toMatchObject({
      id: registerResponse.body.data.id,
      email: 'ada@example.com',
    })

    const persistedUser = await User.findOne({ email: 'ada@example.com' })
    expect(persistedUser).toBeTruthy()
  })

  it('logs in and logs out an existing user', async () => {
    const user = new User({
      name: 'Grace Hopper',
      username: 'grace',
      email: 'grace@example.com',
    })
    await User.register(user, 'secret123')

    const agent = request.agent(app)

    const loginResponse = await agent.post('/accounts/session').send({
      email: 'grace@example.com',
      password: 'secret123',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.data.email).toBe('grace@example.com')

    const logoutResponse = await agent.delete('/accounts/session')
    expect(logoutResponse.status).toBe(204)

    const sessionResponse = await agent.get('/accounts/session')
    expect(sessionResponse.body.data).toBeNull()
  })

  it('rejects invalid credentials', async () => {
    const response = await request(app).post('/accounts/session').send({
      email: 'missing@example.com',
      password: 'wrong',
    })

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS')
  })
})
