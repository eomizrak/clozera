const mockLanguageFind = jest.fn()
const mockLanguagePairFind = jest.fn()
const mockLanguagePairFindOne = jest.fn()
const mockUserFindByIdAndUpdate = jest.fn()

jest.mock('../../models/language', () => ({
  find: mockLanguageFind,
}))

jest.mock('../../models/language-pair', () => ({
  find: mockLanguagePairFind,
  findOne: mockLanguagePairFindOne,
}))

jest.mock('../../models/user', () => ({
  findByIdAndUpdate: mockUserFindByIdAndUpdate,
}))

const languagesService = require('../../services/languages-service')

describe('languages service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists languages sorted by name', async () => {
    const sort = jest.fn().mockResolvedValue([{ name: 'German' }])
    mockLanguageFind.mockReturnValue({ sort })

    await expect(languagesService.listLanguages()).resolves.toEqual([{ name: 'German' }])

    expect(mockLanguageFind).toHaveBeenCalledWith()
    expect(sort).toHaveBeenCalledWith({ name: 1 })
  })

  it('lists only active language pairs with populated languages', async () => {
    const sort = jest.fn().mockResolvedValue([{ slug: 'deu-eng' }])
    const populateBase = jest.fn().mockReturnValue({ sort })
    const populateTarget = jest.fn().mockReturnValue({ populate: populateBase })
    mockLanguagePairFind.mockReturnValue({ populate: populateTarget })

    await expect(languagesService.listLanguagePairs()).resolves.toEqual([{ slug: 'deu-eng' }])

    expect(mockLanguagePairFind).toHaveBeenCalledWith({ active: true })
    expect(populateTarget).toHaveBeenCalledWith('targetLanguage')
    expect(populateBase).toHaveBeenCalledWith('baseLanguage')
    expect(sort).toHaveBeenCalledWith({ name: 1 })
  })

  it('selects a language pair for a user', async () => {
    const pair = { _id: 'pair-id', slug: 'deu-eng' }
    const user = { id: 'user-id', selectedLanguagePair: 'pair-id' }

    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockUserFindByIdAndUpdate.mockResolvedValue(user)

    await expect(languagesService.selectLanguagePair('user-id', 'deu-eng')).resolves.toEqual({ pair, user })

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng' })
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { selectedLanguagePair: 'pair-id' },
      { returnDocument: 'after' }
    )
  })

  it('returns null when the selected language pair does not exist', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(languagesService.selectLanguagePair('user-id', 'missing')).resolves.toBeNull()

    expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled()
  })
})
