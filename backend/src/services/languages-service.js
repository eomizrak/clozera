const Language = require('../models/language')
const LanguagePair = require('../models/language-pair')

async function listLanguages() {
  return Language.find().sort({ name: 1 })
}

async function listLanguagePairs() {
  return LanguagePair.find({ active: true }).populate('targetLanguage').populate('baseLanguage').sort({ name: 1 })
}

module.exports = {
  listLanguages,
  listLanguagePairs,
}
