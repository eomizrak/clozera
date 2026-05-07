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

  it('creates a user and creates an authenticated session', async () => {
    const agent = request.agent(app)

    const registerResponse = await agent.post('/users').send({
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

  it('returns and updates the current user profile', async () => {
    const user = new User({
      name: 'Grace Hopper',
      username: 'grace',
      email: 'grace@example.com',
      timezone: 'UTC',
    })
    await User.register(user, 'secret123')

    const agent = request.agent(app)
    await agent.post('/accounts/session').send({
      email: 'grace@example.com',
      password: 'secret123',
    })

    const profileResponse = await agent.get('/users/me')
    expect(profileResponse.status).toBe(200)
    expect(profileResponse.body.data).toMatchObject({
      name: 'Grace Hopper',
      username: 'grace',
      email: 'grace@example.com',
      timezone: 'UTC',
    })

    const updateResponse = await agent.patch('/users/me').send({
      name: 'Amazing Grace',
      timezone: 'Europe/Berlin',
    })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data).toMatchObject({
      name: 'Amazing Grace',
      username: 'grace',
      timezone: 'Europe/Berlin',
    })
  })

  it('rejects current user profile requests when unauthenticated', async () => {
    const response = await request(app).get('/users/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHENTICATED')
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
