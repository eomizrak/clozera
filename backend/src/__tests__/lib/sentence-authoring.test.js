const {
  extractClozeFromText,
  normalizeSentenceList,
  normalizeSentencePayload,
} = require('../../lib/sentence-authoring')

describe('sentence authoring', () => {
  it('extracts exactly one non-empty cloze marker', () => {
    expect(extractClozeFromText('Ich {{lerne}} heute.')).toBe('lerne')
    expect(extractClozeFromText('Ich {{ lerne }} heute.')).toBe('lerne')
    expect(extractClozeFromText('Ich lerne heute.')).toBe('')
    expect(extractClozeFromText('Ich {{lerne}} {{heute}}.')).toBe('')
    expect(extractClozeFromText('Ich {{ }} heute.')).toBe('')
  })

  it('normalizes answer lists from arrays or text', () => {
    expect(normalizeSentenceList([' lerne ', '', null, 'reise'])).toEqual(['lerne', 'reise'])
    expect(normalizeSentenceList('lerne, reise\nspreche')).toEqual(['lerne', 'reise', 'spreche'])
  })

  it('normalizes an authoring payload and ignores posted cloze', () => {
    expect(
      normalizeSentencePayload({
        text: ' Ich {{lerne}} heute. ',
        translation: ' I learn today. ',
        cloze: 'wrong',
        alternativeAnswers: 'studiere, uebe',
        multipleChoiceOptions: [' lerne ', 'reise'],
        hint: ' verb ',
        notes: ' present tense ',
      })
    ).toEqual({
      text: 'Ich {{lerne}} heute.',
      translation: 'I learn today.',
      cloze: 'lerne',
      alternativeAnswers: ['studiere', 'uebe'],
      multipleChoiceOptions: ['lerne', 'reise'],
      hint: 'verb',
      notes: 'present tense',
    })
  })
})
