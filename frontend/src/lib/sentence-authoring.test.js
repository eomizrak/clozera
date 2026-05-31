import { describe, expect, it } from 'vitest'
import {
  inferClozeFromText,
  listFromMultiline,
  sentenceParts,
  sentencePayloadFromForm,
  textFromList,
} from '@/lib/sentence-authoring'

describe('sentence authoring', () => {
  it('infers exactly one cloze marker', () => {
    expect(inferClozeFromText('Ich {{lerne}} heute.')).toBe('lerne')
    expect(inferClozeFromText('Ich {{ lerne }} heute.')).toBe('lerne')
    expect(inferClozeFromText('Ich lerne heute.')).toBe('')
    expect(inferClozeFromText('Ich {{lerne}} {{heute}}.')).toBe('')
  })

  it('builds sentence preview parts', () => {
    expect(sentenceParts({ text: 'Ich {{lerne}} heute.' })).toEqual([
      { text: 'Ich ', isCloze: false },
      { text: 'lerne', isCloze: true },
      { text: ' heute.', isCloze: false },
    ])
  })

  it('converts answer lists for sentence forms and payloads', () => {
    expect(textFromList(['lerne', 'reise'])).toBe('lerne, reise')
    expect(listFromMultiline('lerne, reise\nspreche')).toEqual(['lerne', 'reise', 'spreche'])
    expect(
      sentencePayloadFromForm({
        text: ' Ich {{lerne}} heute. ',
        translation: ' I learn today. ',
        alternativeAnswers: 'studiere, uebe',
        multipleChoiceOptions: 'lerne\nreise',
        hint: ' verb ',
        notes: ' present tense ',
      })
    ).toEqual({
      text: 'Ich {{lerne}} heute.',
      translation: 'I learn today.',
      alternativeAnswers: ['studiere', 'uebe'],
      multipleChoiceOptions: ['lerne', 'reise'],
      hint: 'verb',
      notes: 'present tense',
    })
  })
})
