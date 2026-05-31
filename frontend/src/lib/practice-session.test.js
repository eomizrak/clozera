import { describe, expect, it } from 'vitest'
import {
  answerMatchesSentence,
  choiceSlotsForSentence,
  practiceModeFromValue,
  sessionSentencesFromCollection,
} from '@/lib/practice-session'

describe('practice session', () => {
  it('normalizes mode values', () => {
    expect(practiceModeFromValue('choice')).toBe('choice')
    expect(practiceModeFromValue('anything-else')).toBe('typed')
  })

  it('matches typed answers against cloze and alternatives', () => {
    const sentence = {
      cloze: 'bald',
      alternativeAnswers: ['soon'],
    }

    expect(answerMatchesSentence(sentence, ' Bald ')).toBe(true)
    expect(answerMatchesSentence(sentence, 'SOON')).toBe(true)
    expect(answerMatchesSentence(sentence, 'later')).toBe(false)
  })

  it('samples up to the session limit', () => {
    const sentences = Array.from({ length: 12 }, (_, index) => ({ id: index }))

    expect(sessionSentencesFromCollection(sentences, 10, () => 0.5)).toHaveLength(10)
  })

  it('builds four multiple choice slots with random distractors and disabled empty slots', () => {
    const sentence = {
      cloze: 'bald',
      multipleChoiceOptions: ['morgen', 'gleich', 'spater', 'sofort', 'bald'],
    }

    const slots = choiceSlotsForSentence(sentence, 4, () => 0.99)

    expect(slots).toHaveLength(4)
    expect(slots.filter((slot) => !slot.disabled)).toHaveLength(4)
    expect(slots.some((slot) => slot.label === 'bald' && slot.isCorrect)).toBe(true)
    expect(slots.filter((slot) => slot.label && slot.label !== 'bald')).toHaveLength(3)
  })

  it('fills missing multiple choice options with disabled slots', () => {
    const slots = choiceSlotsForSentence({ cloze: 'bald', multipleChoiceOptions: [] }, 4, () => 0.5)

    expect(slots).toHaveLength(4)
    expect(slots.filter((slot) => slot.disabled)).toHaveLength(3)
    expect(slots.filter((slot) => !slot.disabled)).toEqual([
      expect.objectContaining({ label: 'bald', isCorrect: true }),
    ])
  })
})
