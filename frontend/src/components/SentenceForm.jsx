import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import {
  inferClozeFromText,
  sentenceParts,
  sentencePayloadFromForm,
  textFromList,
} from '@/lib/sentence-authoring'

// Sentence authoring is domain-specific; both create and edit share this shadcn form.
export default function SentenceForm({ sentence, busy, onSubmit }) {
  const id = useId()
  const [form, setForm] = useState({
    text: sentence?.text || '',
    translation: sentence?.translation || '',
    alternativeAnswers: textFromList(sentence?.alternativeAnswers),
    multipleChoiceOptions: textFromList(sentence?.multipleChoiceOptions),
    hint: sentence?.hint || '',
    notes: sentence?.notes || '',
  })
  const cloze = inferClozeFromText(form.text)
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (cloze) onSubmit(sentencePayloadFromForm(form))
      }}
    >
      {[
        ['text', 'Sentence', 'A {{missing}} word.', true],
        ['translation', 'Translation', 'Translate the full sentence.', true],
        [
          'alternativeAnswers',
          'Alternative answers',
          'Separate answers with commas or new lines.',
          false,
        ],
        [
          'multipleChoiceOptions',
          'Multiple choice options',
          'Separate distractors with commas or new lines.',
          false,
        ],
        ['hint', 'Hint', 'Optional hint', false],
        ['notes', 'Notes', 'Optional notes', false],
      ].map(([name, label, placeholder, required]) => (
        <div className="space-y-2" key={name}>
          <Label htmlFor={`${id}-${name}`}>{label}</Label>
          {name === 'hint' ? (
            <Input
              id={`${id}-${name}`}
              value={form[name]}
              onChange={(event) => setForm({ ...form, [name]: event.target.value })}
              placeholder={placeholder}
            />
          ) : (
            <Textarea
              id={`${id}-${name}`}
              value={form[name]}
              onChange={(event) => setForm({ ...form, [name]: event.target.value })}
              placeholder={placeholder}
              required={required}
              rows={2}
              aria-describedby={name === 'text' ? `${id}-help` : undefined}
            />
          )}
        </div>
      ))}
      <p id={`${id}-help`} className="text-sm text-muted-foreground">
        {'Mark exactly one missing word or phrase with {{double braces}}.'}
      </p>
      {form.text && (
        <div aria-label="Sentence preview" className="rounded-md bg-muted p-3">
          {sentenceParts(form.text).map((part, index) =>
            part.isCloze ? (
              <Badge key={index} variant="secondary">
                {part.text}
              </Badge>
            ) : (
              <span key={index}>{part.text}</span>
            ),
          )}
        </div>
      )}
      <Button className="w-full" disabled={busy || !cloze || !form.translation.trim()}>
        {busy && <Spinner />}
        {sentence ? 'Save sentence' : 'Add sentence'}
      </Button>
    </form>
  )
}
