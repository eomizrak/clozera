const mockRegister = jest.fn()
const mockFindById = jest.fn()
const mockFindByIdAndUpdate = jest.fn()
const mockLanguagePairFindOne = jest.fn()

function MockUser(payload) {
  Object.assign(this, payload)
}

MockUser.register = mockRegister
MockUser.findById = mockFindById
MockUser.findByIdAndUpdate = mockFindByIdAndUpdate

jest.mock('../../models/user', () => MockUser)

jest.mock('../../models/language-pair', () => ({
  findOne: mockLanguagePairFindOne,
}))

const usersService = require('../../services/users-service')

describe('users service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('registers a user and falls back to username when name is missing', async () => {
    mockRegister.mockImplementation(async user => user)

    const user = await usersService.registerUser({
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

  it('gets the current user with selected language pair populated', async () => {
    const user = { id: 'user-id' }
    const populate = jest.fn().mockResolvedValue(user)
    mockFindById.mockReturnValue({ populate })

    await expect(usersService.getCurrentUser('user-id')).resolves.toBe(user)

    expect(mockFindById).toHaveBeenCalledWith('user-id')
    expect(populate).toHaveBeenCalledWith('selectedLanguagePair')
  })

  it('updates current user profile fields', async () => {
    const updatedUser = { id: 'user-id', name: 'Ada L.', username: 'ada', timezone: 'Europe/Berlin' }
    const populate = jest.fn().mockResolvedValue(updatedUser)
    mockFindByIdAndUpdate.mockReturnValue({ populate })

    await expect(
      usersService.updateCurrentUser('user-id', {
        name: 'Ada L.',
        username: 'ada',
        timezone: 'Europe/Berlin',
      })
    ).resolves.toBe(updatedUser)

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      {
        name: 'Ada L.',
        username: 'ada',
        timezone: 'Europe/Berlin',
      },
      { returnDocument: 'after', runValidators: true }
    )
    expect(populate).toHaveBeenCalledWith('selectedLanguagePair')
  })

  it('updates selected language pair by slug', async () => {
    const pair = { _id: 'pair-id', slug: 'deu-eng' }
    const updatedUser = { id: 'user-id', selectedLanguagePair: pair }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    const populate = jest.fn().mockResolvedValue(updatedUser)
    mockFindByIdAndUpdate.mockReturnValue({ populate })

    await expect(usersService.updateCurrentUser('user-id', { selectedLanguagePairSlug: 'deu-eng' })).resolves.toBe(
      updatedUser
    )

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng', active: true })
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { selectedLanguagePair: 'pair-id' },
      { returnDocument: 'after', runValidators: true }
    )
    expect(populate).toHaveBeenCalledWith('selectedLanguagePair')
  })

  it('throws a typed error when selected language pair is missing', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(usersService.updateCurrentUser('user-id', { selectedLanguagePairSlug: 'missing' })).rejects.toMatchObject(
      {
        code: 'LANGUAGE_PAIR_NOT_FOUND',
        status: 404,
      }
    )

    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
  })
})
