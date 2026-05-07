const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose').default
const autopopulate = require('mongoose-autopopulate')

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

module.exports = mongoose.model('User', userSchema)
