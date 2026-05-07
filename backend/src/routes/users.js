const express = require('express')
const usersController = require('../controllers/users-controller')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/users', usersController.createUser)
router.get('/users/me', requireAuth, usersController.getCurrentUser)
router.patch('/users/me', requireAuth, usersController.updateCurrentUser)

module.exports = router
