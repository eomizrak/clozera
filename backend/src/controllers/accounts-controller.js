import passport from 'passport'
import * as accountsService from '../services/accounts-service.js'
import * as usersService from '../services/users-service.js'

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

    return req.login(user, async loginError => {
      if (loginError) return next(loginError)

      try {
        const currentUser = await usersService.getCurrentUser(user.id)
        return res.json({ data: accountsService.serializeUser(currentUser) })
      } catch (currentUserError) {
        return next(currentUserError)
      }
    })
  })(req, res, next)
}

async function getSession(req, res, next) {
  try {
    if (!req.user) {
      return res.json({ data: null })
    }

    const user = await usersService.getCurrentUser(req.user.id)
    return res.json({ data: accountsService.serializeUser(user) })
  } catch (error) {
    return next(error)
  }
}

function logout(req, res, next) {
  req.logout(error => {
    if (error) return next(error)
    return res.status(204).send()
  })
}

export { login, getSession, logout }
