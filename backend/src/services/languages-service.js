const Language = require('../models/language')
const LanguagePair = require('../models/language-pair')
const User = require('../models/user')

async function listLanguages() {
  return Language.find().sort({ name: 1 })
}

async function listLanguagePairs() {
  return LanguagePair.find({ active: true }).populate('targetLanguage').populate('baseLanguage').sort({ name: 1 })
}

async function selectLanguagePair(userId, languagePairSlug) {
  const pair = await LanguagePair.findOne({ slug: languagePairSlug })

  if (!pair) {
    return null
  }

  const user = await User.findByIdAndUpdate(userId, { selectedLanguagePair: pair._id }, { returnDocument: 'after' })

  return {
    user,
    pair,
  }
}

module.exports = {
  listLanguages,
  listLanguagePairs,
  selectLanguagePair,
}
