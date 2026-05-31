export function inferClozeFromText(text) {
  const matches = Array.from(String(text || '').matchAll(/\{\{(.*?)\}\}/g))

  if (matches.length !== 1) return ''

  return matches[0][1].trim()
}

export function sentenceParts(sentenceOrText) {
  const text = typeof sentenceOrText === 'string' ? sentenceOrText : sentenceOrText?.text

  return String(text || '')
    .split(/(\{\{.*?\}\})/g)
    .filter(Boolean)
    .map((part) => {
      const isCloze = part.startsWith('{{') && part.endsWith('}}')

      return {
        text: isCloze ? part.slice(2, -2) : part,
        isCloze,
      }
    })
}

export function textFromList(value) {
  return (value || []).join(', ')
}

export function listFromMultiline(value) {
  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function sentencePayloadFromForm(form) {
  return {
    text: form.text.trim(),
    translation: form.translation.trim(),
    alternativeAnswers: listFromMultiline(form.alternativeAnswers),
    multipleChoiceOptions: listFromMultiline(form.multipleChoiceOptions),
    hint: form.hint.trim(),
    notes: form.notes.trim(),
  }
}
