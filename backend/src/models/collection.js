const mongoose = require('mongoose')

const collectionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    languagePair: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LanguagePair',
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollectionGroup',
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['fast_track', 'cefr', 'topic'],
      default: 'fast_track',
    },
    level: { type: String, default: '' },
    isOfficial: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    sentenceCount: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

collectionSchema.index({ languagePair: 1, type: 1, order: 1 })
collectionSchema.index({ languagePair: 1, slug: 1 }, { unique: true })

module.exports = mongoose.model('Collection', collectionSchema)
