const mockCollectionFind = jest.fn()
const mockCollectionFindOne = jest.fn()
const mockCollectionCreate = jest.fn()
const mockCollectionSentenceCountDocuments = jest.fn()
const mockCollectionSentenceCreate = jest.fn()
const mockCollectionSentenceFind = jest.fn()
const mockLanguagePairFindOne = jest.fn()
const mockResolveActiveLanguagePair = jest.fn()

jest.mock('../../models/collection', () => ({
  create: mockCollectionCreate,
  find: mockCollectionFind,
  findOne: mockCollectionFindOne,
}))

jest.mock('../../models/collection-sentence', () => ({
  countDocuments: mockCollectionSentenceCountDocuments,
  create: mockCollectionSentenceCreate,
  find: mockCollectionSentenceFind,
}))

jest.mock('../../models/language-pair', () => ({
  findOne: mockLanguagePairFindOne,
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
    const sort = jest.fn().mockResolvedValue(result)
    mockCollectionFind.mockReturnValue({ sort })
    return { sort }
  }

  function sentenceFindChain(result) {
    const limit = jest.fn().mockResolvedValue(result)
    const skip = jest.fn().mockReturnValue({ limit })
    const sort = jest.fn().mockReturnValue({ skip })
    mockCollectionSentenceFind.mockReturnValue({ sort })
    return { limit, skip, sort }
  }

  it('lists collections by language pair slug', async () => {
    const pair = { _id: 'pair-id' }
    const collections = [{ name: 'Fast Track' }]
    const { sort } = collectionFindChain(collections)
    mockLanguagePairFindOne.mockResolvedValue(pair)

    await expect(collectionsService.listCollectionsBySlug('deu-eng')).resolves.toEqual(collections)

    expect(mockLanguagePairFindOne).toHaveBeenCalledWith({ slug: 'deu-eng' })
    expect(mockCollectionFind).toHaveBeenCalledWith({ languagePair: 'pair-id', $or: [{ isPublic: true }] })
    expect(sort).toHaveBeenCalledWith({ order: 1 })
  })

  it('throws a typed error when a language pair is missing', async () => {
    mockLanguagePairFindOne.mockResolvedValue(null)

    await expect(collectionsService.listCollectionsBySlug('missing')).rejects.toMatchObject({
      code: 'LANGUAGE_PAIR_NOT_FOUND',
      status: 404,
    })
  })

  it('lists collections for the active user language pair', async () => {
    const pair = { _id: 'pair-id' }
    const collections = [{ name: 'A1' }]
    collectionFindChain(collections)
    mockResolveActiveLanguagePair.mockResolvedValue(pair)

    await expect(collectionsService.listCollectionsForUser({ id: 'user-id' })).resolves.toEqual(collections)

    expect(mockResolveActiveLanguagePair).toHaveBeenCalledWith({ id: 'user-id' })
    expect(mockCollectionFind).toHaveBeenCalledWith({
      languagePair: 'pair-id',
      $or: [{ isPublic: true }, { owner: 'user-id' }],
    })
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
    const pair = { _id: 'pair-id' }
    const createdCollection = { id: 'collection-id', name: 'My Phrases' }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionFindOne.mockResolvedValue(null)
    mockCollectionCreate.mockResolvedValue(createdCollection)

    await expect(
      collectionsService.createCollection(
        {
          languagePairSlug: 'deu-eng',
          name: 'My Phrases',
          description: 'Useful phrases',
        },
        { id: 'user-id' }
      )
    ).resolves.toEqual(createdCollection)

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
  })

  it('adds a numeric suffix when a collection slug already exists for the language pair', async () => {
    const pair = { _id: 'pair-id' }
    const createdCollection = { id: 'collection-id', name: 'Travel Phrases', slug: 'travel-phrases-2' }
    mockLanguagePairFindOne.mockResolvedValue(pair)
    mockCollectionFindOne.mockResolvedValueOnce({ _id: 'existing-collection-id' }).mockResolvedValueOnce(null)
    mockCollectionCreate.mockResolvedValue(createdCollection)

    await expect(
      collectionsService.createCollection(
        {
          languagePairSlug: 'deu-eng',
          name: 'Travel Phrases',
        },
        { id: 'user-id' }
      )
    ).resolves.toEqual(createdCollection)

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

  it('adds a sentence to an owned collection and updates the sentence count', async () => {
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
          cloze: 'lerne',
        },
        { id: 'user-id' }
      )
    ).resolves.toMatchObject({
      id: 'sentence-id',
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
      cloze: 'lerne',
    })

    expect(mockCollectionFindOne).toHaveBeenCalledWith({ _id: 'collection-id', owner: 'user-id' })
    expect(mockCollectionSentenceCreate).toHaveBeenCalledWith({
      owner: 'user-id',
      collection: 'collection-id',
      text: 'Ich {{lerne}}.',
      translation: 'I learn.',
      cloze: 'lerne',
      alternativeAnswers: [],
      multipleChoiceOptions: [],
      hint: '',
      notes: '',
      order: 2,
    })
    expect(collection.sentenceCount).toBe(3)
    expect(collection.save).toHaveBeenCalled()
  })
})
