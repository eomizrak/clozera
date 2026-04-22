const mockCollectionFind = jest.fn()
const mockCollectionGroupFind = jest.fn()
const mockLanguagePairFindOne = jest.fn()
const mockResolveActiveLanguagePair = jest.fn()

jest.mock('../../models/collection', () => ({
  find: mockCollectionFind,
}))

jest.mock('../../models/collection-group', () => ({
  find: mockCollectionGroupFind,
}))

jest.mock('../../models/language-pair', () => ({
  findOne: mockLanguagePairFindOne,
}))

jest.mock('../../lib/active-language-pair', () => ({
  resolveActiveLanguagePair: mockResolveActiveLanguagePair,
}))

const dashboardService = require('../../services/dashboard-service')

describe('dashboard service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function sortedFind(mockFind, result) {
    const sort = jest.fn().mockResolvedValue(result)
    mockFind.mockReturnValue({ sort })
    return sort
  }

  it('builds dashboard payload without progress metrics', async () => {
    const pair = {
      _id: 'pair-id',
      id: 'pair-id',
      slug: 'deu-eng',
      name: 'German from English',
    }
    const group = {
      id: 'group-id',
      name: 'Fast Track',
      type: 'fast_track',
      description: 'Starter set',
      order: 1,
    }
    const collection = {
      id: 'collection-id',
      group: 'group-id',
      name: 'Level 1',
      slug: 'level-1',
      description: 'Intro',
      type: 'fast_track',
      level: 'A1',
      sentenceCount: 12,
    }

    mockLanguagePairFindOne.mockResolvedValue(pair)
    sortedFind(mockCollectionGroupFind, [group])
    sortedFind(mockCollectionFind, [collection])

    const payload = await dashboardService.getDashboard({ id: 'user-id', username: 'ada' }, 'deu-eng')

    expect(payload).toEqual({
      user: {
        id: 'user-id',
        username: 'ada',
      },
      languagePair: {
        id: 'pair-id',
        slug: 'deu-eng',
        name: 'German from English',
      },
      collectionGroups: [
        {
          id: 'group-id',
          name: 'Fast Track',
          type: 'fast_track',
          description: 'Starter set',
          order: 1,
        },
      ],
      collections: [
        {
          id: 'collection-id',
          groupId: 'group-id',
          name: 'Level 1',
          slug: 'level-1',
          description: 'Intro',
          type: 'fast_track',
          level: 'A1',
          numSentences: 12,
        },
      ],
    })
    expect(payload.languagePair).not.toHaveProperty('score')
    expect(payload.collections[0]).not.toHaveProperty('numReadyForReview')
    expect(mockCollectionFind).toHaveBeenCalledWith({
      languagePair: 'pair-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
  })

  it('uses the active user language pair for my dashboard', async () => {
    const pair = {
      _id: 'pair-id',
      id: 'pair-id',
      slug: 'deu-eng',
      name: 'German from English',
    }

    mockResolveActiveLanguagePair.mockResolvedValue(pair)
    sortedFind(mockCollectionGroupFind, [])
    sortedFind(mockCollectionFind, [])

    await expect(dashboardService.getMyDashboard({ id: 'user-id', username: 'ada' })).resolves.toMatchObject({
      languagePair: {
        slug: 'deu-eng',
      },
    })
  })

  it('throws a typed error when the dashboard language pair is missing', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(dashboardService.getDashboard({ id: 'user-id' }, 'missing')).rejects.toMatchObject({
      code: 'LANGUAGE_PAIR_NOT_FOUND',
      status: 404,
    })
  })
})
