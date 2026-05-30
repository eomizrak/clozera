const User = require('../models/user')
const LanguagePair = require('../models/language-pair')

function languagePairNotFoundError() {
  const error = new Error('Language pair not found.')
  error.status = 404
  error.code = 'LANGUAGE_PAIR_NOT_FOUND'
  return error
}

function serializeLanguagePair(pair) {
  if (!pair) return null

  if (!pair.slug) {
    return pair
  }

  return {
    id: pair.id,
    slug: pair.slug,
    name: pair.name,
  }
}

function serializeUser(user) {
  if (!user) return null

  const languagePairs = Array.isArray(user.languagePairs) ? user.languagePairs.map(serializeLanguagePair) : []

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    selectedLanguagePair: serializeLanguagePair(user.selectedLanguagePair),
    languagePairs,
    timezone: user.timezone,
  }
}

async function registerUser({ name, username, email, password, timezone }) {
  const user = new User({
    name: name || username,
    username,
    email,
    timezone,
  })

  return User.register(user, password)
}

async function getCurrentUser(userId) {
  return User.findById(userId).populate('selectedLanguagePair').populate('languagePairs')
}

async function updateCurrentUser(userId, payload = {}) {
  const updates = {}

  if (Object.prototype.hasOwnProperty.call(payload, 'name')) {
    updates.name = payload.name
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'username')) {
    updates.username = payload.username
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'timezone')) {
    updates.timezone = payload.timezone
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'selectedLanguagePairSlug')) {
    const pair = await LanguagePair.findOne({ slug: payload.selectedLanguagePairSlug, active: true })

    if (!pair) {
      throw languagePairNotFoundError()
    }

    updates.selectedLanguagePair = pair._id
    updates.$addToSet = { languagePairs: pair._id }
  }

  return User.findByIdAndUpdate(userId, updates, { returnDocument: 'after', runValidators: true })
    .populate('selectedLanguagePair')
    .populate('languagePairs')
}

module.exports = {
  getCurrentUser,
  registerUser,
  serializeUser,
  updateCurrentUser,
}
