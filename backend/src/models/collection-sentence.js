const mongoose = require('mongoose')

const collectionSentenceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    collection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true },
    translation: { type: String, required: true, trim: true },
    cloze: { type: String, required: true, trim: true },
    alternativeAnswers: [{ type: String, trim: true }],
    multipleChoiceOptions: [{ type: String, trim: true }],
    hint: { type: String, default: '' },
    notes: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
)

collectionSentenceSchema.index({ collection: 1, order: 1 })
collectionSentenceSchema.index({ collection: 1, cloze: 1 })

module.exports = mongoose.model('CollectionSentence', collectionSentenceSchema)
