const User = require('../models/user')

function serializeUser(user) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    selectedLanguagePair: user.selectedLanguagePair,
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

module.exports = {
  registerUser,
  serializeUser,
}
