import * as usersService from '../services/users-service.js'

async function createUser(req, res, next) {
  try {
    const registeredUser = await usersService.registerUser(req.body)

    req.login(registeredUser, error => {
      if (error) return next(error)
      return res.status(201).json({ data: usersService.serializeUser(registeredUser) })
    })
  } catch (error) {
    next(error)
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const user = await usersService.getCurrentUser(req.user.id)
    res.json({ data: usersService.serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

async function updateCurrentUser(req, res, next) {
  try {
    const user = await usersService.updateCurrentUser(req.user.id, req.body)
    res.json({ data: usersService.serializeUser(user) })
  } catch (error) {
    next(error)
  }
}

export { createUser, getCurrentUser, updateCurrentUser }
