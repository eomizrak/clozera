import express from 'express'
import * as accountsController from '../controllers/accounts-controller.js'

const router = express.Router()

router.post('/session', accountsController.login)
router.get('/session', accountsController.getSession)
router.delete('/session', accountsController.logout)

export default router
