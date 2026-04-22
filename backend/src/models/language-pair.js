const mongoose = require('mongoose')

const languagePairSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    targetLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
    },
    baseLanguage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
    },
    name: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    totalSentences: { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model('LanguagePair', languagePairSchema)
