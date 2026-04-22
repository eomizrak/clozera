const request = require('supertest')
const User = require('../models/user')

async function createUser(overrides = {}) {
  const password = overrides.password || 'secret123'
  const user = new User({
    name: overrides.name || 'Test User',
    username: overrides.username || 'testuser',
    email: overrides.email || 'test@example.com',
    role: overrides.role || 'user',
    timezone: overrides.timezone || 'UTC',
  })

  const registeredUser = await User.register(user, password)

  return {
    password,
    user: registeredUser,
  }
}

async function loginAs(app, overrides = {}) {
  const credentials = await createUser(overrides)
  const agent = request.agent(app)

  await agent.post('/accounts/session').send({
    email: credentials.user.email,
    password: credentials.password,
  })

  return {
    agent,
    ...credentials,
  }
}

module.exports = {
  createUser,
  loginAs,
}
