import mongoose from 'mongoose'
import passportLocalMongooseModule from 'passport-local-mongoose'
import autopopulate from 'mongoose-autopopulate'

const passportLocalMongoose = passportLocalMongooseModule.default

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    selectedLanguagePair: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LanguagePair',
      default: null,
    },
    languagePairs: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'LanguagePair',
        },
      ],
      default: [],
    },
    pinnedCollections: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Collection',
        },
      ],
      default: [],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    timezone: {
      type: String,
      default: 'UTC',
      trim: true,
    },
  },
  { timestamps: true }
)

userSchema.plugin(autopopulate)
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

export default mongoose.model('User', userSchema)
