const mongoose = require('mongoose')

const languageSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    iso3: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    nativeName: { type: String, required: true, trim: true },
    flagIso: { type: String, required: true, trim: true },
    rtl: { type: Boolean, default: false },
    ttsLocale: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Language', languageSchema)
