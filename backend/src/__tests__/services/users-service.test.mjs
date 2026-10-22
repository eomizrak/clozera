import { afterAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import User from '../../models/user.js'
import LanguagePair from '../../models/language-pair.js'
import * as usersService from '../../services/users-service.js'

const mockRegister = vi.spyOn(User, 'register').mockImplementation(() => undefined)
const mockFindById = vi.spyOn(User, 'findById').mockImplementation(() => undefined)
const mockFindByIdAndUpdate = vi.spyOn(User, 'findByIdAndUpdate').mockImplementation(() => undefined)
const mockLanguagePairFindOne = vi.spyOn(LanguagePair, 'findOne').mockImplementation(() => undefined)

afterAll(() => vi.restoreAllMocks())

describe('users service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

  it('gets the current user with selected and saved language pairs populated', async () => {
    const user = { id: 'user-id' }
    const secondPopulate = vi.fn().mockResolvedValue(user)
    const populate = vi.fn().mockReturnValue({ populate: secondPopulate })
    mockFindById.mockReturnValue({ populate })

    await expect(usersService.getCurrentUser('user-id')).resolves.toBe(user)

    expect(mockFindById).toHaveBeenCalledWith('user-id')
    expect(populate).toHaveBeenCalledWith('selectedLanguagePair')
    expect(secondPopulate).toHaveBeenCalledWith('languagePairs')
  })

  it('updates current user profile fields', async () => {
    const updatedUser = { id: 'user-id', name: 'Ada L.', username: 'ada', timezone: 'Europe/Berlin' }
    const secondPopulate = vi.fn().mockResolvedValue(updatedUser)
    const populate = vi.fn().mockReturnValue({ populate: secondPopulate })
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
    expect(secondPopulate).toHaveBeenCalledWith('languagePairs')
  })

  it('updates selected language pair by slug and saves it without duplicates', async () => {
    const pair = { _id: 'pair-id', slug: 'deu-eng' }
    const updatedUser = { id: 'user-id', selectedLanguagePair: pair }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    const secondPopulate = vi.fn().mockResolvedValue(updatedUser)
    const populate = vi.fn().mockReturnValue({ populate: secondPopulate })
    mockFindByIdAndUpdate.mockReturnValue({ populate })

    await expect(usersService.updateCurrentUser('user-id', { selectedLanguagePairSlug: 'deu-eng' })).resolves.toBe(
      updatedUser
    )

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng', active: true })
    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      {
        selectedLanguagePair: 'pair-id',
        $addToSet: { languagePairs: 'pair-id' },
      },
      { returnDocument: 'after', runValidators: true }
    )
    expect(populate).toHaveBeenCalledWith('selectedLanguagePair')
    expect(secondPopulate).toHaveBeenCalledWith('languagePairs')
  })

  it('throws a typed error when selected language pair is missing', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(
      usersService.updateCurrentUser('user-id', { selectedLanguagePairSlug: 'missing' })
    ).rejects.toMatchObject({
      code: 'LANGUAGE_PAIR_NOT_FOUND',
      status: 404,
    })

    expect(mockFindByIdAndUpdate).not.toHaveBeenCalled()
  })
})
