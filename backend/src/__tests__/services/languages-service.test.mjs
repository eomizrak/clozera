import { afterAll, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import Language from '../../models/language.js'
import LanguagePair from '../../models/language-pair.js'
import * as languagesService from '../../services/languages-service.js'

const mockLanguageFind = vi.spyOn(Language, 'find').mockImplementation(() => undefined)
const mockLanguagePairFind = vi.spyOn(LanguagePair, 'find').mockImplementation(() => undefined)

afterAll(() => vi.restoreAllMocks())

describe('languages service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists languages sorted by name', async () => {
    const sort = vi.fn().mockResolvedValue([{ name: 'German' }])
    mockLanguageFind.mockReturnValue({ sort })

    await expect(languagesService.listLanguages()).resolves.toEqual([{ name: 'German' }])

    expect(mockLanguageFind).toHaveBeenCalledWith()
    expect(sort).toHaveBeenCalledWith({ name: 1 })
  })

  it('lists only active language pairs with populated languages', async () => {
    const sort = vi.fn().mockResolvedValue([{ slug: 'deu-eng' }])
    const populateBase = vi.fn().mockReturnValue({ sort })
    const populateTarget = vi.fn().mockReturnValue({ populate: populateBase })
    mockLanguagePairFind.mockReturnValue({ populate: populateTarget })

    await expect(languagesService.listLanguagePairs()).resolves.toEqual([{ slug: 'deu-eng' }])

    expect(mockLanguagePairFind).toHaveBeenCalledWith({ active: true })
    expect(populateTarget).toHaveBeenCalledWith('targetLanguage')
    expect(populateBase).toHaveBeenCalledWith('baseLanguage')
    expect(sort).toHaveBeenCalledWith({ name: 1 })
  })
})
