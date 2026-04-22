const passport = require('passport')
const accountsService = require('../services/accounts-service')

async function register(req, res, next) {
  try {
    const registeredUser = await accountsService.registerUser(req.body)

    req.login(registeredUser, error => {
      if (error) return next(error)
      return res.status(201).json({ data: accountsService.serializeUser(registeredUser) })
    })
  } catch (error) {
    next(error)
  }
}

function login(req, res, next) {
  passport.authenticate('local', (error, user, info) => {
    if (error) return next(error)

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: info?.message || 'Invalid username or password.',
          details: [],
        },
      })
    }

    return req.login(user, loginError => {
      if (loginError) return next(loginError)
      return res.json({ data: accountsService.serializeUser(user) })
    })
  })(req, res, next)
}

function getSession(req, res) {
  res.json({ data: accountsService.serializeUser(req.user) })
}

function logout(req, res, next) {
  req.logout(error => {
    if (error) return next(error)
    return res.status(204).send()
  })
}

module.exports = {
  register,
  login,
  getSession,
  logout,
}
