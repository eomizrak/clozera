const mockCollectionFind = jest.fn()
const mockCollectionFindOne = jest.fn()
const mockCollectionCreate = jest.fn()
const mockCollectionCountDocuments = jest.fn()
const mockCollectionDeleteOne = jest.fn()
const mockCollectionSentenceCountDocuments = jest.fn()
const mockCollectionSentenceCreate = jest.fn()
const mockCollectionSentenceDeleteMany = jest.fn()
const mockCollectionSentenceFind = jest.fn()
const mockCollectionSentenceFindOne = jest.fn()
const mockLanguagePairFindOne = jest.fn()
const mockResolveActiveLanguagePair = jest.fn()
const mockUserFindByIdAndUpdate = jest.fn()
const mockUserUpdateMany = jest.fn()

jest.mock('../../models/collection', () => ({
  countDocuments: mockCollectionCountDocuments,
  create: mockCollectionCreate,
  deleteOne: mockCollectionDeleteOne,
  find: mockCollectionFind,
  findOne: mockCollectionFindOne,
}))

jest.mock('../../models/collection-sentence', () => ({
  countDocuments: mockCollectionSentenceCountDocuments,
  create: mockCollectionSentenceCreate,
  deleteMany: mockCollectionSentenceDeleteMany,
  extractClozeFromText: text => {
    const matches = Array.from(String(text || '').matchAll(/\{\{(.*?)\}\}/g))

    if (matches.length !== 1) {
      return ''
    }

    return matches[0][1].trim()
  },
  find: mockCollectionSentenceFind,
  findOne: mockCollectionSentenceFindOne,
}))

jest.mock('../../models/language-pair', () => ({
  findOne: mockLanguagePairFindOne,
}))

jest.mock('../../models/user', () => ({
  findByIdAndUpdate: mockUserFindByIdAndUpdate,
  updateMany: mockUserUpdateMany,
}))

jest.mock('../../lib/active-language-pair', () => ({
  resolveActiveLanguagePair: mockResolveActiveLanguagePair,
}))

const collectionsService = require('../../services/collections-service')

describe('collections service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function collectionFindChain(result) {
    const limit = jest.fn().mockResolvedValue(result)
    const skip = jest.fn().mockReturnValue({ limit })
    const sort = jest.fn().mockReturnValue({ skip })
    const populate = jest.fn().mockReturnValue({ sort })
    mockCollectionFind.mockReturnValue({ populate })
    return { limit, populate, skip, sort }
  }

  function sentenceFindChain(result) {
    const limit = jest.fn().mockResolvedValue(result)
    const skip = jest.fn().mockReturnValue({ limit })
    const sort = jest.fn().mockReturnValue({ skip })
    mockCollectionSentenceFind.mockReturnValue({ sort })
    return { limit, skip, sort }
  }

  it('lists paginated accessible collections by language pair slug', async () => {
    const pair = { _id: 'pair-id' }
    const collections = [
      {
        id: 'collection-id',
        name: 'Fast Track',
        slug: 'fast-track',
        description: '',
        type: 'fast_track',
        level: 'A1',
        sentenceCount: 2,
        isOfficial: true,
        isPublic: true,
        languagePair: { id: 'pair-id', slug: 'deu-eng', name: 'German from English' },
      },
    ]
    const { limit, populate, skip, sort } = collectionFindChain(collections)
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionCountDocuments.mockResolvedValue(1)

    await expect(
      collectionsService.listCollections({ languagePair: 'deu-eng', page: 2, perPage: 10, user: { id: 'user-id' } })
    ).resolves.toMatchObject({
      collections: [
        {
          id: 'collection-id',
          name: 'Fast Track',
          slug: 'fast-track',
          description: '',
          type: 'fast_track',
          level: 'A1',
          sentenceCount: 2,
          isOfficial: true,
          isPublic: true,
          relationship: 'official',
          visibility: 'public',
          isPinned: false,
          capabilities: {
            canEdit: false,
            canDelete: false,
            canChangeVisibility: false,
            canPin: true,
            canUnpin: false,
          },
          languagePair: {
            id: 'pair-id',
            slug: 'deu-eng',
            name: 'German from English',
          },
        },
      ],
      meta: {
        total: 1,
        page: 2,
        perPage: 10,
      },
    })

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng', active: true })
    expect(mockCollectionCountDocuments).toHaveBeenCalledWith({
      languagePair: 'pair-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
    expect(mockCollectionFind).toHaveBeenCalledWith({
      languagePair: 'pair-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
    expect(populate).toHaveBeenCalledWith(['languagePair', 'group', 'owner'])
    expect(sort).toHaveBeenCalledWith({ order: 1 })
    expect(skip).toHaveBeenCalledWith(10)
    expect(limit).toHaveBeenCalledWith(10)
  })

  it('throws a typed error when a language pair is missing', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(collectionsService.listCollections({ languagePair: 'missing' })).rejects.toMatchObject({
      code: 'LANGUAGE_PAIR_NOT_FOUND',
      status: 404,
    })
  })

  it('lists only owned collections when owner is me', async () => {
    const collections = [
      {
        id: 'collection-id',
        owner: 'user-id',
        name: 'A1',
        slug: 'a1',
        sentenceCount: 0,
        isOfficial: false,
        isPublic: false,
      },
    ]
    collectionFindChain(collections)
    mockCollectionCountDocuments.mockResolvedValue(1)

    await expect(collectionsService.listCollections({ owner: 'me', user: { id: 'user-id' } })).resolves.toMatchObject({
      collections: [
        {
          id: 'collection-id',
          name: 'A1',
          relationship: 'owned',
          visibility: 'private',
        },
      ],
      meta: {
        total: 1,
        page: 1,
        perPage: 20,
      },
    })

    expect(mockCollectionFind).toHaveBeenCalledWith({ owner: 'user-id' })
  })

  it('lists all accessible collections without a language pair filter', async () => {
    collectionFindChain([])
    mockCollectionCountDocuments.mockResolvedValue(0)

    await expect(collectionsService.listCollections({ user: { id: 'user-id' } })).resolves.toEqual({
      collections: [],
      meta: {
        total: 0,
        page: 1,
        perPage: 20,
      },
    })

    expect(mockCollectionFind).toHaveBeenCalledWith({ $or: [{ isPublic: true }, { owner: 'user-id' }] })
    expect(mockCollectionCountDocuments).toHaveBeenCalledWith({ $or: [{ isPublic: true }, { owner: 'user-id' }] })
  })

  it('lists dashboard collections for the requested language pair', async () => {
    const pair = { _id: 'pair-id' }
    const populate = jest.fn().mockResolvedValue([])
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionFind.mockReturnValue({ populate })

    await expect(
      collectionsService.listDashboardCollections({
        languagePair: 'deu-eng',
        user: { id: 'user-id', pinnedCollections: ['collection-id'] },
      })
    ).resolves.toEqual({
      collections: [],
      meta: {
        total: 0,
        page: 1,
        perPage: 0,
      },
    })

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng', active: true })
    expect(mockCollectionFind).toHaveBeenCalledWith({
      _id: { $in: ['collection-id'] },
      $or: [{ isPublic: true }, { owner: 'user-id' }],
      languagePair: 'pair-id',
    })
    expect(populate).toHaveBeenCalledWith(['languagePair', 'group', 'owner'])
  })

  it('throws a typed error when a collection is missing', async () => {
    mockCollectionFindOne.mockResolvedValue(null)

    await expect(collectionsService.getCollection('collection-id', { id: 'user-id' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    })
    expect(mockCollectionFindOne).toHaveBeenCalledWith({
      _id: 'collection-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
  })

  it('lists paginated sentences without progress data', async () => {
    const sentence = {
      id: 'sentence-1',
      text: 'Ich {{bin}} hier.',
      translation: 'I am here.',
      cloze: 'bin',
      alternativeAnswers: [],
      multipleChoiceOptions: ['bin', 'bist'],
      hint: '',
      notes: '',
      internalField: 'hidden',
    }

    mockCollectionFindOne.mockResolvedValue({ _id: 'collection-id' })
    const { limit, skip, sort } = sentenceFindChain([sentence])
    mockCollectionSentenceCountDocuments.mockResolvedValue(1)

    await expect(
      collectionsService.listSentences({
        collectionId: 'collection-id',
        query: 'ich',
        context: 'text',
        page: 2,
        perPage: 10,
        user: { id: 'user-id' },
      })
    ).resolves.toEqual({
      sentences: [
        {
          id: 'sentence-1',
          text: 'Ich {{bin}} hier.',
          translation: 'I am here.',
          cloze: 'bin',
          alternativeAnswers: [],
          multipleChoiceOptions: ['bin', 'bist'],
          hint: '',
          notes: '',
        },
      ],
      meta: {
        total: 1,
        page: 2,
        perPage: 10,
      },
    })

    expect(mockCollectionFindOne).toHaveBeenCalledWith({
      _id: 'collection-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
    expect(mockCollectionSentenceCountDocuments).toHaveBeenCalledWith({
      collection: 'collection-id',
      text: { $regex: 'ich', $options: 'i' },
    })
    expect(sort).toHaveBeenCalledWith({ order: 1 })
    expect(skip).toHaveBeenCalledWith(10)
    expect(limit).toHaveBeenCalledWith(10)
  })

  it('creates a private user collection for a language pair', async () => {
    const pair = { _id: 'pair-id', id: 'pair-id', slug: 'deu-eng', name: 'German from English' }
    const createdCollection = {
      _id: 'collection-id',
      id: 'collection-id',
      owner: 'user-id',
      name: 'My Phrases',
      slug: 'my-phrases',
      description: 'Useful phrases',
      type: 'topic',
      level: '',
      sentenceCount: 0,
      isOfficial: false,
      isPublic: false,
    }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionFindOne.mockResolvedValue(null)
    mockCollectionCreate.mockResolvedValue(createdCollection)
    mockUserFindByIdAndUpdate.mockResolvedValue({ id: 'user-id', pinnedCollections: ['collection-id'] })

    await expect(
      collectionsService.createCollection(
        {
          languagePairSlug: 'deu-eng',
          name: 'My Phrases',
          description: 'Useful phrases',
        },
        { id: 'user-id' }
      )
    ).resolves.toMatchObject({
      id: 'collection-id',
      name: 'My Phrases',
      relationship: 'owned',
      visibility: 'private',
      isPinned: true,
    })

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng', active: true })
    expect(mockCollectionCreate).toHaveBeenCalledWith({
      owner: 'user-id',
      languagePair: 'pair-id',
      name: 'My Phrases',
      slug: 'my-phrases',
      description: 'Useful phrases',
      type: 'topic',
      level: '',
      isOfficial: false,
      isPublic: false,
      order: 0,
    })
    expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith('user-id', {
      $addToSet: { pinnedCollections: 'collection-id' },
    })
  })

  it('adds a numeric suffix when a collection slug already exists for the language pair', async () => {
    const pair = { _id: 'pair-id' }
    const createdCollection = {
      _id: 'collection-id',
      id: 'collection-id',
      owner: 'user-id',
      name: 'Travel Phrases',
      slug: 'travel-phrases-2',
      description: '',
      type: 'topic',
      level: '',
      sentenceCount: 0,
      isOfficial: false,
      isPublic: false,
    }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionFindOne.mockResolvedValueOnce({ _id: 'existing-collection-id' }).mockResolvedValueOnce(null)
    mockCollectionCreate.mockResolvedValue(createdCollection)
    mockUserFindByIdAndUpdate.mockResolvedValue({ id: 'user-id', pinnedCollections: ['collection-id'] })

    await expect(
      collectionsService.createCollection(
        {
          languagePairSlug: 'deu-eng',
          name: 'Travel Phrases',
        },
        { id: 'user-id' }
      )
    ).resolves.toMatchObject({
      id: 'collection-id',
      slug: 'travel-phrases-2',
      isPinned: true,
    })

    expect(mockCollectionFindOne).toHaveBeenNthCalledWith(1, {
      languagePair: 'pair-id',
      slug: 'travel-phrases',
    })
    expect(mockCollectionFindOne).toHaveBeenNthCalledWith(2, {
      languagePair: 'pair-id',
      slug: 'travel-phrases-2',
    })
    expect(mockCollectionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'travel-phrases-2',
      })
    )
  })

  it('rejects invalid collection visibility values', async () => {
    const collection = {
      _id: 'collection-id',
      owner: 'user-id',
      isOfficial: false,
      save: jest.fn(),
    }
    mockCollectionFindOne.mockResolvedValue(collection)

    await expect(
      collectionsService.updateCollection(
        'collection-id',
        {
          visibility: 'shared',
        },
        { id: 'user-id' }
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Visibility must be public or private.',
      details: [{ field: 'visibility', message: 'Visibility must be public or private.' }],
    })

    expect(collection.save).not.toHaveBeenCalled()
  })

  it('rejects collection metadata changes for non-owners with forbidden even when private', async () => {
    mockCollectionFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: 'collection-id',
        owner: 'other-user-id',
        isOfficial: false,
        isPublic: false,
      })

    await expect(
      collectionsService.updateCollection(
        'collection-id',
        {
          name: 'Changed',
        },
        { id: 'user-id' }
      )
    ).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    })

    expect(mockCollectionFindOne).toHaveBeenNthCalledWith(1, {
      _id: 'collection-id',
      owner: 'user-id',
      isOfficial: false,
    })
    expect(mockCollectionFindOne).toHaveBeenNthCalledWith(2, { _id: 'collection-id' })
  })

  it('adds a sentence to an owned collection and derives the cloze from text', async () => {
    const collection = {
      _id: 'collection-id',
      sentenceCount: 2,
      save: jest.fn().mockResolvedValue(undefined),
    }
    const createdSentence = {
      id: 'sentence-id',
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
      cloze: 'lerne',
      alternativeAnswers: [],
      multipleChoiceOptions: [],
      hint: '',
      notes: '',
    }
    mockCollectionFindOne.mockResolvedValue(collection)
    mockCollectionSentenceCreate.mockResolvedValue(createdSentence)
    mockCollectionSentenceCountDocuments.mockResolvedValue(3)

    await expect(
      collectionsService.createSentence(
        'collection-id',
        {
          text: 'Ich {{lerne}}.',
          translation: 'I learn.',
        },
        { id: 'user-id' }
      )
    ).resolves.toMatchObject({
      id: 'sentence-id',
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
      cloze: 'lerne',
    })

    expect(mockCollectionFindOne).toHaveBeenCalledWith({ _id: 'collection-id', owner: 'user-id', isOfficial: false })
    expect(mockCollectionSentenceCreate).toHaveBeenCalledWith({
      owner: 'user-id',
      collection: 'collection-id',
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
      alternativeAnswers: [],
      multipleChoiceOptions: [],
      hint: '',
      notes: '',
      order: 2,
    })
    expect(collection.sentenceCount).toBe(3)
    expect(collection.save).toHaveBeenCalled()
  })

  it('does not pass a conflicting posted cloze value to the model', async () => {
    const collection = {
      _id: 'collection-id',
      sentenceCount: 0,
      save: jest.fn().mockResolvedValue(undefined),
    }
    mockCollectionFindOne.mockResolvedValue(collection)
    mockCollectionSentenceCreate.mockResolvedValue({
      id: 'sentence-id',
      text: 'Ich {{reise}}.',
      translation: 'I travel.',
      cloze: 'reise',
      alternativeAnswers: [],
      multipleChoiceOptions: [],
      hint: '',
      notes: '',
    })
    mockCollectionSentenceCountDocuments.mockResolvedValue(1)

    await collectionsService.createSentence(
      'collection-id',
      {
        text: 'Ich {{reise}}.',
        translation: 'I travel.',
        cloze: 'wrong',
      },
      { id: 'user-id' }
    )

    expect(mockCollectionSentenceCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({
        cloze: expect.anything(),
      })
    )
  })

  it.each([
    ['missing marker', 'Ich reise morgen.'],
    ['empty marker', 'Ich {{ }} morgen.'],
    ['multiple markers', 'Ich {{reise}} {{morgen}}.'],
  ])('rejects sentence text with %s', async (_caseName, text) => {
    mockCollectionFindOne.mockResolvedValue({
      _id: 'collection-id',
      sentenceCount: 0,
      save: jest.fn().mockResolvedValue(undefined),
    })

    await expect(
      collectionsService.createSentence(
        'collection-id',
        {
          text,
          translation: 'I travel tomorrow.',
        },
        { id: 'user-id' }
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Sentence text must contain exactly one non-empty cloze marker.',
    })

    expect(mockCollectionSentenceCreate).not.toHaveBeenCalled()
  })

  it('updates an owned sentence without passing cloze through the payload', async () => {
    const collection = {
      _id: 'collection-id',
    }
    const sentence = {
      id: 'sentence-id',
      text: 'Ich {{reise}} heute.',
      translation: 'I travel today.',
      cloze: 'reise',
      alternativeAnswers: [],
      multipleChoiceOptions: [],
      hint: '',
      notes: '',
      save: jest.fn().mockImplementation(() => {
        sentence.cloze = 'lerne'
        return Promise.resolve()
      }),
    }
    mockCollectionFindOne.mockResolvedValue(collection)
    mockCollectionSentenceFindOne.mockResolvedValue(sentence)

    await expect(
      collectionsService.updateSentence(
        'collection-id',
        'sentence-id',
        {
          text: 'Ich {{lerne}} heute.',
          translation: 'I learn today.',
          cloze: 'wrong',
          alternativeAnswers: ['lerne'],
          multipleChoiceOptions: ['lerne', 'reise'],
          hint: 'verb',
          notes: 'present tense',
        },
        { id: 'user-id' }
      )
    ).resolves.toMatchObject({
      id: 'sentence-id',
      text: 'Ich {{lerne}} heute.',
      translation: 'I learn today.',
      cloze: 'lerne',
      alternativeAnswers: ['lerne'],
      multipleChoiceOptions: ['lerne', 'reise'],
      hint: 'verb',
      notes: 'present tense',
    })

    expect(mockCollectionFindOne).toHaveBeenCalledWith({ _id: 'collection-id', owner: 'user-id', isOfficial: false })
    expect(mockCollectionSentenceFindOne).toHaveBeenCalledWith({
      _id: 'sentence-id',
      collection: 'collection-id',
    })
    expect(sentence.save).toHaveBeenCalled()
    expect(sentence).not.toHaveProperty('cloze', 'wrong')
  })

  it('rejects sentence updates with invalid cloze markers', async () => {
    mockCollectionFindOne.mockResolvedValue({ _id: 'collection-id' })
    mockCollectionSentenceFindOne.mockResolvedValue({
      id: 'sentence-id',
      save: jest.fn(),
    })

    await expect(
      collectionsService.updateSentence(
        'collection-id',
        'sentence-id',
        {
          text: 'Ich {{reise}} {{heute}}.',
          translation: 'I travel today.',
        },
        { id: 'user-id' }
      )
    ).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Sentence text must contain exactly one non-empty cloze marker.',
    })
  })
})
