function extractClozeFromText(text) {
  const matches = Array.from(String(text || '').matchAll(/\{\{(.*?)\}\}/g))

  if (matches.length !== 1) {
    return ''
  }

  return matches[0][1].trim()
}

function normalizeSentenceList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean)
  }

  return String(value || '')
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean)
}

function normalizeSentencePayload(payload = {}) {
  const text = String(payload.text || '').trim()
  const translation = String(payload.translation || '').trim()
  const cloze = extractClozeFromText(text)

  return {
    text,
    translation,
    cloze,
    alternativeAnswers: normalizeSentenceList(payload.alternativeAnswers),
    multipleChoiceOptions: normalizeSentenceList(payload.multipleChoiceOptions),
    hint: String(payload.hint || '').trim(),
    notes: String(payload.notes || '').trim(),
  }
}

module.exports = {
  extractClozeFromText,
  normalizeSentenceList,
  normalizeSentencePayload,
}
