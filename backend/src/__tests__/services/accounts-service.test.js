const accountsService = require('../../services/accounts-service')

describe('accounts service', () => {
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
