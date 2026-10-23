import { BookOpen, Headphones, Keyboard, Layers, ListChecks } from 'lucide-react'
import { PRACTICE_MODES } from '@/lib/practice-session'

// Display metadata is shared by setup and practice. Session logic stays framework-independent.
export const PRACTICE_MODE_OPTIONS = [
  {
    value: PRACTICE_MODES.choice,
    label: 'Multiple choice',
    icon: ListChecks,
    badge: 'Recognition',
    description: 'Choose the missing word from the available answers.',
    instruction: 'Choose the word that completes the sentence.',
  },
  {
    value: PRACTICE_MODES.typed,
    label: 'Typed answer',
    icon: Keyboard,
    badge: 'Recall',
    description: 'Write the missing word from memory, without answer choices.',
    instruction: 'Complete the sentence. Alternative answers are accepted.',
  },
  {
    value: PRACTICE_MODES.flashcard,
    label: 'Flashcards',
    icon: Layers,
    badge: 'Self-check',
    description: 'Recall the word, reveal the answer, then rate how well you remembered it.',
    instruction: 'Recall the missing word, then reveal the answer to check yourself.',
  },
]

// Activities describe how a sentence is presented; modes describe how it is answered.
// Listening stays unavailable until there is a real audio source and playback behavior.
export const PRACTICE_ACTIVITY_OPTIONS = [
  {
    value: 'reading',
    label: 'Vocabulary',
    icon: BookOpen,
    description: 'Read sentences in context.',
    available: true,
  },
  {
    value: 'listening',
    label: 'Listening',
    icon: Headphones,
    description: 'Audio practice is coming soon.',
    available: false,
  },
]

export { SESSION_LIMIT_OPTIONS } from '@/lib/practice-session'

export function practiceModeOption(mode) {
  return PRACTICE_MODE_OPTIONS.find((option) => option.value === mode) || PRACTICE_MODE_OPTIONS[1]
}
