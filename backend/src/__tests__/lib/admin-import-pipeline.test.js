const {
  collectionGroupImportDocument,
  collectionImportDocument,
  normalizeImportSentences,
  resolveImportOwner,
  resolveLanguagePairImport,
} = require('../../lib/admin-import-pipeline')

describe('admin import pipeline', () => {
  it('resolves import owners with typed errors', async () => {
    await expect(resolveImportOwner('', { UserModel: {}, isValidObjectId: () => true })).rejects.toMatchObject({
      code: 'OWNER_REQUIRED',
      status: 400,
    })
    await expect(
      resolveImportOwner('bad-id', {
        UserModel: {},
        isValidObjectId: () => false,
      })
    ).rejects.toMatchObject({
      code: 'OWNER_NOT_FOUND',
      status: 404,
    })
    await expect(
      resolveImportOwner('user-id', {
        UserModel: { findById: jest.fn().mockResolvedValue(null) },
        isValidObjectId: () => true,
      })
    ).rejects.toMatchObject({
      code: 'OWNER_NOT_FOUND',
      status: 404,
    })

    const user = { _id: 'user-id' }
    await expect(
      resolveImportOwner('user-id', {
        UserModel: { findById: jest.fn().mockResolvedValue(user) },
        isValidObjectId: () => true,
      })
    ).resolves.toBe(user)
  })

  it('resolves language pair import documents', async () => {
    const LanguageModel = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ _id: 'target-id' })
        .mockResolvedValueOnce({ _id: 'base-id' }),
    }

    await expect(
      resolveLanguagePairImport(
        {
          slug: 'deu-eng',
          targetLanguageIso3: 'deu',
          baseLanguageCode: 'en',
          name: 'German from English',
        },
        { LanguageModel }
      )
    ).resolves.toEqual({
      slug: 'deu-eng',
      targetLanguage: 'target-id',
      baseLanguage: 'base-id',
      name: 'German from English',
      active: true,
      totalSentences: 0,
    })
    expect(LanguageModel.findOne).toHaveBeenNthCalledWith(1, { $or: [{ iso3: 'deu' }, { code: 'deu' }] })
    expect(LanguageModel.findOne).toHaveBeenNthCalledWith(2, { $or: [{ iso3: 'en' }, { code: 'en' }] })
  })

  it('rejects language pair imports when a language is missing', async () => {
    const LanguageModel = {
      findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 'base-id' }),
    }

    await expect(
      resolveLanguagePairImport(
        {
          slug: 'deu-eng',
          targetLanguageIso3: 'deu',
          baseLanguageIso3: 'eng',
          name: 'German from English',
        },
        { LanguageModel }
      )
    ).rejects.toMatchObject({
      code: 'LANGUAGE_NOT_FOUND',
      status: 404,
      message: 'Language not found: deu',
    })
  })

  it('builds collection group and collection import documents', () => {
    const pair = { _id: 'pair-id' }
    const owner = { _id: 'owner-id' }
    const groupByType = new Map([['fast_track', 'group-id']])

    expect(collectionGroupImportDocument({ type: 'fast_track', name: 'Fast Track' }, pair)).toEqual({
      type: 'fast_track',
      name: 'Fast Track',
      languagePair: 'pair-id',
    })
    expect(
      collectionImportDocument(
        {
          groupType: 'fast_track',
          name: 'Fast Track Level 1',
          slug: 'fast-track-level-1',
        },
        { pair, owner, groupByType }
      )
    ).toEqual({
      name: 'Fast Track Level 1',
      slug: 'fast-track-level-1',
      owner: 'owner-id',
      languagePair: 'pair-id',
      group: 'group-id',
    })
  })

  it('normalizes imported sentences and reports indexed validation errors', () => {
    expect(
      normalizeImportSentences(
        [
          {
            text: ' Wer {{weiss}}? ',
            translation: ' Who knows? ',
            cloze: 'wrong',
            alternativeAnswers: 'weiss, weiss es',
          },
        ],
        {
          collectionId: 'collection-id',
          owner: { _id: 'owner-id' },
        }
      )
    ).toEqual([
      {
        text: 'Wer {{weiss}}?',
        translation: 'Who knows?',
        cloze: 'weiss',
        alternativeAnswers: ['weiss', 'weiss es'],
        multipleChoiceOptions: [],
        hint: '',
        notes: '',
        owner: 'owner-id',
        collection: 'collection-id',
        order: 0,
      },
    ])

    expect(() =>
      normalizeImportSentences([{ text: 'Ich {{bin}} {{hier}}.', translation: 'I am here.' }], {
        collectionId: 'collection-id',
        owner: { _id: 'owner-id' },
      })
    ).toThrow(expect.objectContaining({
      code: 'VALIDATION_ERROR',
      details: [{ field: 'sentences.0.cloze', message: 'Sentence cloze is required.' }],
    }))
  })
})
