const DEFAULT_SESSION_LIMIT = 10
const DEFAULT_CHOICE_COUNT = 4

export const PRACTICE_MODES = {
  typed: 'typed',
  choice: 'choice',
}

export function practiceModeFromValue(value) {
  return value === PRACTICE_MODES.choice ? PRACTICE_MODES.choice : PRACTICE_MODES.typed
}

export function normalizedAnswer(value) {
  return String(value || '').trim().toLocaleLowerCase()
}

export function answerMatchesSentence(sentence, answer) {
  const normalized = normalizedAnswer(answer)
  const acceptedAnswers = [sentence?.cloze, ...(sentence?.alternativeAnswers || [])].map(normalizedAnswer)

  return Boolean(normalized && acceptedAnswers.includes(normalized))
}

export function shuffledItems(items = [], random = Math.random) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled
}

export function sessionSentencesFromCollection(sentences = [], limit = DEFAULT_SESSION_LIMIT, random = Math.random) {
  return shuffledItems(sentences, random).slice(0, limit)
}

export function choiceSlotsForSentence(
  sentence,
  choiceCount = DEFAULT_CHOICE_COUNT,
  random = Math.random,
) {
  const correctAnswer = String(sentence?.cloze || '').trim()
  const distractors = shuffledItems(
    Array.from(new Set((sentence?.multipleChoiceOptions || []).map((option) => String(option).trim()).filter(Boolean)))
      .filter((option) => normalizedAnswer(option) !== normalizedAnswer(correctAnswer)),
    random,
  ).slice(0, Math.max(choiceCount - 1, 0))
  const activeOptions = shuffledItems([correctAnswer, ...distractors].filter(Boolean), random)
  const emptyOptions = Array.from({ length: Math.max(choiceCount - activeOptions.length, 0) }, () => '')

  return [...activeOptions, ...emptyOptions].map((label, index) => ({
    id: label ? `choice-${index}-${normalizedAnswer(label)}` : `empty-${index}`,
    label,
    disabled: !label,
    isCorrect: normalizedAnswer(label) === normalizedAnswer(correctAnswer),
  }))
}
