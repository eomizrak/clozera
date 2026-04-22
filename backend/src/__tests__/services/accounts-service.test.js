const mockRegister = jest.fn()

function MockUser(payload) {
  Object.assign(this, payload)
}

MockUser.register = mockRegister

jest.mock('../../models/user', () => MockUser)

const accountsService = require('../../services/accounts-service')

describe('accounts service', () => {
  beforeEach(() => {
    mockRegister.mockReset()
  })

  it('registers a user and falls back to username when name is missing', async () => {
    mockRegister.mockImplementation(async user => user)

    const user = await accountsService.registerUser({
      username: 'ada',
      email: 'ada@example.com',
      password: 'secret123',
      timezone: 'Europe/Berlin',
    })

    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ name: 'ada' }), 'secret123')
    expect(user).toMatchObject({
      name: 'ada',
      username: 'ada',
      email: 'ada@example.com',
      timezone: 'Europe/Berlin',
    })
  })

  it('serializes public user fields', () => {
    const user = {
      id: 'user-1',
      name: 'Ada',
      username: 'ada',
      email: 'ada@example.com',
      role: 'admin',
      selectedLanguagePair: 'pair-1',
      timezone: 'UTC',
      hash: 'hidden',
      salt: 'hidden',
    }

    expect(accountsService.serializeUser(user)).toEqual({
      id: 'user-1',
      name: 'Ada',
      username: 'ada',
      email: 'ada@example.com',
      role: 'admin',
      selectedLanguagePair: 'pair-1',
      timezone: 'UTC',
    })
  })

  it('serializes missing users as null', () => {
    expect(accountsService.serializeUser(null)).toBeNull()
  })
})
