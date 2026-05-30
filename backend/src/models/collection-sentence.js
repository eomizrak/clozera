const mongoose = require('mongoose')
const { extractClozeFromText } = require('../lib/sentence-authoring')

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

collectionSentenceSchema.statics.extractClozeFromText = extractClozeFromText

collectionSentenceSchema.pre('validate', function syncClozeFromText() {
  if (this.isModified('text') || !this.cloze) {
    this.cloze = extractClozeFromText(this.text)
  }
})

function clozeSyncedUpdate(update) {
  if (!update) return update

  if (update.text) {
    update.cloze = extractClozeFromText(update.text)
  }

  if (update.$set?.text) {
    update.$set.cloze = extractClozeFromText(update.$set.text)
  }

  return update
}

collectionSentenceSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function syncUpdatedCloze() {
  this.setUpdate(clozeSyncedUpdate(this.getUpdate()))
})

module.exports = mongoose.model('CollectionSentence', collectionSentenceSchema)
