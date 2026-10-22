import LanguagePair from '../models/language-pair.js'

async function resolveActiveLanguagePair(user) {
  if (user?.selectedLanguagePair) {
    const selectedLanguagePairId = user.selectedLanguagePair._id || user.selectedLanguagePair
    const selectedLanguagePair = await LanguagePair.findById(selectedLanguagePairId)

    if (selectedLanguagePair?.active) {
      return selectedLanguagePair
    }
  }

  return LanguagePair.findOne({ active: true }).sort({ name: 1 })
}

export { resolveActiveLanguagePair }
