import Language from '../models/language.js'
import LanguagePair from '../models/language-pair.js'

async function listLanguages() {
  return Language.find().sort({ name: 1 })
}

async function listLanguagePairs() {
  return LanguagePair.find({ active: true }).populate('targetLanguage').populate('baseLanguage').sort({ name: 1 })
}

export { listLanguages, listLanguagePairs }
