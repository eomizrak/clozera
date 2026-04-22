const mongoose = require('mongoose')

const collectionGroupSchema = new mongoose.Schema(
  {
    languagePair: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LanguagePair',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

collectionGroupSchema.index({ languagePair: 1, order: 1 })

module.exports = mongoose.model('CollectionGroup', collectionGroupSchema)
