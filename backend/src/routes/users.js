import express from 'express'
import * as usersController from '../controllers/users-controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

router.post('/users', usersController.createUser)
router.get('/users/me', requireAuth, usersController.getCurrentUser)
router.patch('/users/me', requireAuth, usersController.updateCurrentUser)

export default router
